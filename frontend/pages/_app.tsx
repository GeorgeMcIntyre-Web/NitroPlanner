import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from 'react-query'
import { AuthProvider } from '../contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'
import Layout from '../components/Layout'

const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout>
          <Component {...pageProps} />
          <Toaster position="top-right" />
        </Layout>
      </AuthProvider>
    </QueryClientProvider>
  )
} 