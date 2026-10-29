import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { admin, society, structure, members, rules } = body

    if (!admin || !admin.name || !admin.phone) {
      return NextResponse.json(
        { error: 'Admin full name and valid mobile number are required' },
        { status: 400 }
      )
    }

    if (!society || !society.name) {
      return NextResponse.json(
        { error: 'Society / RWA name is required' },
        { status: 400 }
      )
    }

    const password = admin.pin || admin.password
    if (!password) {
      return NextResponse.json(
        { error: 'Admin Security PIN is required for account creation' },
        { status: 400 }
      )
    }
    const passwordHash = await hashPassword(password)

    // Clean and validate admin phone number (10 digits)
    const rawPhone = String(admin.phone).trim().replace(/\D/g, '')
    const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number for the admin' },
        { status: 400 }
      )
    }

    // Check admin email uniqueness in User table
    let validAdminEmail: string | null = admin.email?.trim() || null
    if (validAdminEmail) {
      const emailUser = await prisma.user.findUnique({
        where: { email: validAdminEmail }
      })
      if (emailUser && emailUser.phone !== cleanPhone) {
        console.warn(`Admin email ${validAdminEmail} already taken, proceeding without email for this user`)
        validAdminEmail = null
      }
    }

    // 1. Create Brand New Organization in Database
    let regNo = society.registrationNo?.trim() || `CHD/RWA/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
    
    // Ensure unique registration number
    const existingOrg = await prisma.organization.findFirst({
      where: { registrationNo: regNo }
    })
    if (existingOrg) {
      regNo = `${regNo}-${Math.floor(100 + Math.random() * 900)}`
    }

    const org = await prisma.organization.create({
      data: {
        name: society.name.trim(),
        registrationNo: regNo,
        address: society.address || '',
        city: society.city || 'Chandigarh',
        pincode: society.pincode || '',
        phone: cleanPhone,
        email: validAdminEmail,
        status: 'ACTIVE',
        plan: 'GROWTH',
      }
    })

    // 1b. Persist initial location settings if mapLocation or address provided
    try {
      const fs = await import('fs')
      const path = await import('path')
      const settingsStorePath = path.join(process.cwd(), 'settings_store.json')
      let allData: any = {}
      if (fs.existsSync(settingsStorePath)) {
        allData = JSON.parse(fs.readFileSync(settingsStorePath, 'utf-8'))
      }
      allData[org.id] = allData[org.id] || {}

      const mapLoc = society.mapLocation ? String(society.mapLocation).trim() : ''
      const hasMap = Boolean(mapLoc)
      let mapEmbedUrl = ''
      if (hasMap) {
        mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapLoc)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
      } else if (society.address) {
        const query = [society.address, society.city || 'Chandigarh', society.pincode].filter(Boolean).join(', ')
        mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
      }

      allData[org.id].location = {
        googleMapsUrl: mapLoc,
        address: society.address || '',
        city: society.city || 'Chandigarh',
        pincode: society.pincode || '',
        mapEmbedUrl,
        isConfigured: hasMap || Boolean(society.address && society.address.length > 3),
      }
      fs.writeFileSync(settingsStorePath, JSON.stringify(allData, null, 2), 'utf-8')
    } catch (e) {
      console.error('Error saving initial society location:', e)
    }

    // 2. Create or update RWA Admin User
    let adminUser = await prisma.user.findFirst({
      where: { phone: cleanPhone }
    })

    if (adminUser) {
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          name: admin.name.trim(),
          email: admin.email?.trim() || adminUser.email,
          role: 'RWA_ADMIN',
          organizationId: org.id,
          passwordHash,
          status: 'ACTIVE'
        }
      })
    } else {
      adminUser = await prisma.user.create({
        data: {
          name: admin.name.trim(),
          phone: cleanPhone,
          email: admin.email?.trim() || null,
          role: 'RWA_ADMIN',
          organizationId: org.id,
          passwordHash,
          status: 'ACTIVE'
        }
      })
    }

    // 3. Create Blocks from structure
    const blocksList = structure?.blocks || [
      { name: 'Tower A', floors: 4, unitsPerFloor: 4 }
    ]

    const createdBlocks: Record<string, string> = {}
    for (const b of blocksList) {
      const blockName = b.name || 'Block A'
      let block = await prisma.block.findFirst({
        where: { organizationId: org.id, name: blockName }
      })
      const floors = parseInt(b.floors) || 4
      const unitsPerFloor = parseInt(b.unitsPerFloor) || 4
      const totalUnits = floors * unitsPerFloor

      if (!block) {
        block = await prisma.block.create({
          data: {
            organizationId: org.id,
            name: blockName,
            floors,
            totalUnits,
          }
        })
      }
      createdBlocks[blockName] = block.id
    }

    // 4. Create Units from structure
    let generatedUnits = structure?.generatedUnits || []
    if (generatedUnits.length === 0 && blocksList.length > 0) {
      for (const b of blocksList) {
        const blockName = b.name || 'Tower A'
        const blockId = createdBlocks[blockName]
        const floors = parseInt(b.floors) || 4
        const unitsPerFloor = parseInt(b.unitsPerFloor) || 4
        const prefix = b.unitPrefix || (blockName.includes(' ') ? blockName.split(' ')[1] + '-' : blockName.charAt(0) + '-')

        for (let f = 1; f <= floors; f++) {
          for (let u = 1; u <= unitsPerFloor; u++) {
            generatedUnits.push({
              unitNumber: `${prefix}${f}0${u}`,
              blockId,
              blockName,
              floor: f,
              unitType: b.defaultType || 'FLAT_2BHK',
              areaSqft: b.areaSqft || 1250,
            })
          }
        }
      }
    }

    let unitsCreatedCount = 0
    for (const u of generatedUnits) {
      const unitNumber = u.unitNumber || u.number
      const blockId = u.blockId || (u.blockName && createdBlocks[u.blockName] ? createdBlocks[u.blockName] : null)

      const existingUnit = await prisma.unit.findFirst({
        where: { organizationId: org.id, unitNumber }
      })

      if (!existingUnit) {
        await prisma.unit.create({
          data: {
            organizationId: org.id,
            blockId,
            unitNumber,
            unitType: u.unitType || 'FLAT_2BHK',
            floor: parseInt(u.floor) || 1,
            areaSqft: parseFloat(u.areaSqft) || 1250,
            occupancyStatus: 'VACANT',
          }
        })
        unitsCreatedCount++
      }
    }

    // 5. Import Members from Roster
    const importedMembers = members?.importedRows || []
    let membersImportedCount = 0

    for (const m of importedMembers) {
      const unitNumber = m.unitNumber || m.unit
      const memberName = m.name || m.memberName
      const memberPhone = m.phone ? m.phone.replace(/\s+/g, '') : null
      const memberEmail = m.email || null
      const isOwner = (m.type || m.ownershipType || 'OWNER').toUpperCase().includes('OWNER')

      if (unitNumber) {
        let unit = await prisma.unit.findFirst({
          where: { organizationId: org.id, unitNumber }
        })

        if (!unit) {
          unit = await prisma.unit.create({
            data: {
              organizationId: org.id,
              unitNumber,
              unitType: 'FLAT_2BHK',
              occupancyStatus: isOwner ? 'OWNER_OCCUPIED' : 'TENANTED',
              ownerName: isOwner ? memberName : null,
              ownerPhone: isOwner ? memberPhone : null,
              tenantName: !isOwner ? memberName : null,
              tenantPhone: !isOwner ? memberPhone : null,
            }
          })
        } else {
          await prisma.unit.update({
            where: { id: unit.id },
            data: {
              occupancyStatus: isOwner ? 'OWNER_OCCUPIED' : 'TENANTED',
              ownerName: isOwner ? memberName : unit.ownerName,
              ownerPhone: isOwner ? memberPhone : unit.ownerPhone,
              ownerEmail: isOwner ? memberEmail : unit.ownerEmail,
              tenantName: !isOwner ? memberName : unit.tenantName,
              tenantPhone: !isOwner ? memberPhone : unit.tenantPhone,
            }
          })
        }

        const rawMPhone = memberPhone ? String(memberPhone).replace(/\D/g, '') : ''
        const cleanMPhone = rawMPhone.length >= 10 ? rawMPhone.slice(-10) : rawMPhone
        if (cleanMPhone.length === 10) {
          const existingResUser = await prisma.user.findFirst({
            where: { phone: cleanMPhone }
          })
          if (!existingResUser) {
            let validMemberEmail: string | null = memberEmail ? String(memberEmail).trim().toLowerCase() : null
            if (validMemberEmail) {
              const existingEmailUser = await prisma.user.findUnique({
                where: { email: validMemberEmail }
              })
              if (existingEmailUser) {
                validMemberEmail = null
              }
            }
            await prisma.user.create({
              data: {
                name: memberName || 'Resident',
                phone: cleanMPhone,
                email: validMemberEmail,
                role: 'RESIDENT',
                organizationId: org.id,
                unitId: unit.id,
                status: 'ACTIVE'
              }
            })
          }
        }
        membersImportedCount++
      }
    }

    // 6. Create default Charge Heads (Schema compliant)
    const baseAmt = parseFloat(rules?.baseAmount || rules?.baseMaintenance || '3000') || 3000
    const chargeName = 'Monthly Maintenance'
    const existingMaint = await prisma.chargeHead.findFirst({
      where: { organizationId: org.id, name: chargeName }
    })
    if (!existingMaint) {
      await prisma.chargeHead.create({
        data: {
          organizationId: org.id,
          name: chargeName,
          basis: rules?.maintenanceModel === 'PER_SQFT' ? 'PER_SQFT' : 'FIXED',
          amount: baseAmt,
          frequency: rules?.billingCycle || 'MONTHLY',
          isActive: true,
        }
      })
    }

    const existingSinking = await prisma.chargeHead.findFirst({
      where: { organizationId: org.id, name: 'Sinking Fund' }
    })
    if (!existingSinking) {
      await prisma.chargeHead.create({
        data: {
          organizationId: org.id,
          name: 'Sinking Fund',
          basis: 'FIXED',
          amount: 200,
          frequency: 'MONTHLY',
          isActive: true,
        }
      })
    }

    // Update total units count on organization
    const actualTotalUnits = await prisma.unit.count({ where: { organizationId: org.id } })
    await prisma.organization.update({
      where: { id: org.id },
      data: { totalUnits: actualTotalUnits }
    })

    // 7. Generate Session Token for the New Society Admin
    const token = await createSession(adminUser.id)

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        phone: adminUser.phone,
        email: adminUser.email,
        role: adminUser.role,
        designation: admin.designation || 'President & Admin',
        organizationId: org.id,
        organization: {
          id: org.id,
          name: org.name,
          city: org.city,
        },
      },
      organization: {
        id: org.id,
        name: org.name,
        city: org.city,
        registrationNo: org.registrationNo,
        totalUnits: actualTotalUnits,
      },
      stats: {
        unitsCreated: unitsCreatedCount,
        membersImported: membersImportedCount,
      }
    })

    // Set HTTP-only Cookie for seamless authentication
    response.cookies.set({
      name: 'rwa_token',
      value: token,
      httpOnly: false, // Accessible to script for client hydration
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error: any) {
    console.error('Society Registration error:', error)
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred during society registration' },
      { status: 500 }
    )
  }
}
