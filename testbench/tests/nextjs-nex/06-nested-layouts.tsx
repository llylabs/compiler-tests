// @expect-contains: <html lang="en">
// @expect-contains: <nav>Main Nav</nav>
// @expect-contains: <aside>Dashboard Sidebar</aside>
// @expect-contains: <h1>Analytics</h1>
import React from 'react'

// Root layout
function RootLayout({children}: {children: any}) {
  return (
    <html lang="en">
      <body>
        <nav>Main Nav</nav>
        {children}
      </body>
    </html>
  );
}

// Dashboard layout (nested)
function DashboardLayout({children}: {children: any}) {
  return (
    <div className="dashboard">
      <aside>Dashboard Sidebar</aside>
      <main>{children}</main>
    </div>
  );
}

// Page content
function AnalyticsPage() {
  return <h1>Analytics</h1>;
}

// Compose: RootLayout > DashboardLayout > Page
var html = renderToString(
  <RootLayout>
    <DashboardLayout>
      <AnalyticsPage />
    </DashboardLayout>
  </RootLayout>
);

if (!html.includes('Main Nav')) throw new Error('Missing nav');
if (!html.includes('Dashboard Sidebar')) throw new Error('Missing sidebar');
if (!html.includes('Analytics')) throw new Error('Missing page content');
console.log(html);
