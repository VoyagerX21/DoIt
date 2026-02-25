import './globals.css';

export const metadata = {
  title: 'DoIt Task Manager',
  description: 'Next.js frontend for Task Manager assessment'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
