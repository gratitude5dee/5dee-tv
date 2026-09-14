import { notFound } from 'next/navigation'
import AssetStudioVisualFixture from '../../../components/AssetStudioVisualFixture'

export default function VisualTestPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <AssetStudioVisualFixture />
}
