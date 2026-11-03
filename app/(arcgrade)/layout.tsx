import '@rainbow-me/rainbowkit/styles.css';
import { ArcGradeProviders } from '@/components/ArcGradeProviders';

/**
 * ArcGrade route layout.
 *
 * The RainbowKit/wagmi/QueryClient stack is mounted here (and only here) so the
 * Terminal and the swap app never load it. The root layout is left untouched.
 */
export default function ArcGradeLayout({ children }: { children: React.ReactNode }) {
  return <ArcGradeProviders>{children}</ArcGradeProviders>;
}
