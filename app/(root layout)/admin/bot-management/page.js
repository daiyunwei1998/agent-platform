import Dashboard from '@/app/components/Dashboard'
import React from 'react'
import { cookies } from 'next/headers'

export default function page() {
    const tenantId = cookies().get('tenantId')?.value
  return (
    <Dashboard tenantId = {tenantId}></Dashboard>
  )
}
