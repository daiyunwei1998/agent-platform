import { headers } from 'next/headers';
import { host, tenantServiceHost } from '@/app/config';


const DEFAULT_TENANT_INFO = {
  logo: '/agent.png',
  name: '閃應雲客服平台',
};

async function fetchTenantData(alias) {
  try {
    console.log(`Fetching tenant info from: ${tenantServiceHost}/api/v1/tenants/${alias}`);

    const response = await fetch(`${tenantServiceHost}/api/v1/tenants/${alias}`, {});
    
    if (!response.ok) {
      console.error(`Tenant not found for alias: ${alias}. Status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log('Received tenant data:', data);

    return data;
  } catch (error) {
    console.error(`Error fetching tenant data for alias: ${alias}`, error);
    return null;
  }
}

function processTenantData(data) {
  if (!data) return DEFAULT_TENANT_INFO;

  return {
    logo: data.logo || DEFAULT_TENANT_INFO.logo,
    name: data.name ? data.name : DEFAULT_TENANT_INFO.name,
  };
}

export default async function RootLayout({ children }) {
  const headersList = headers();
  const hostname = headersList.get('host') || '';
  const currentHost = new URL(`http://${hostname}`).hostname;
  
  console.log(`Current hostname: ${currentHost}`);
  
  let tenantInfo = DEFAULT_TENANT_INFO;
  
  if (currentHost !== new URL(host).hostname) {
    const alias = currentHost.split('.')[0];
    console.log(`Extracted alias: ${alias}`);
    
    const fetchedTenantData = await fetchTenantData(alias);
    tenantInfo = processTenantData(fetchedTenantData);
    
    console.log(`Using tenant info for alias: ${alias}`, tenantInfo);
  } else {
    console.log('Using default tenant info for main domain');
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" href={tenantInfo.logo} />
        <title>{`${tenantInfo.name} | 閃應雲客服平台`}</title>
      </head>
      <body>
          {children}
      </body>
    </html>
  );
}

export const metadata = {
  title: '閃應雲客服平台',
  description: '閃應雲客服平台',
};