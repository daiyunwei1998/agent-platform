import Dashboard from '@/app/components/Dashboard'
import React from 'react'
import { CookiesProvider } from 'react-cookie'

export default function page() {
    const tenantId = cookies().get('tenantId')?.value
  return (
    <Dashboard tenantId = {tenantId}></Dashboard>
  )
}
