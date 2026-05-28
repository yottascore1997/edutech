import LegalDocumentScreen from '@/components/legal/LegalDocumentScreen';
import {
  Baby,
  Lock,
  RefreshCw,
  Settings,
  Share2,
  Shield,
  UserCheck,
} from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
    return (
    <LegalDocumentScreen
      badge="LEGAL"
      title="Privacy"
      titleAccent="Policy"
      subtitle="How we collect, use, and protect your data"
      headerIcon={Shield}
      intro='Yottascore ("we", "our", "us") is committed to protecting your privacy. This policy explains how we handle your personal information when you use our app and services.'
      contactEmail="yottascore@gmail.com"
      footerNote="This privacy policy is effective as of January 1, 2025."
      sections={[
        {
          title: '1. Information We Collect',
          icon: Shield,
          iconColor: '#6344D4',
          iconBg: '#EDE9FE',
          body:
            'We may collect:\n\n• **Personal Information:** Name, mobile number, and email address.\n\n• **Payment Information:** Processed securely through Razorpay. We do not store your full payment details.\n\n• **Device Information:** Device model, OS, and app version to improve your experience.',
        },
        {
          title: '2. How We Use Your Information',
          icon: Settings,
          iconColor: '#7C3AED',
          iconBg: '#F3E8FF',
          body:
            'We use your information to:\n\n• Register and manage your account.\n\n• Let you participate in live exams, practice tests, and battles.\n\n• Process entry fees and reward distributions.\n\n• Send notifications about exams, results, and updates.\n\n• Improve the app and resolve support queries.',
        },
        {
          title: '3. Sharing of Information',
          icon: Share2,
          iconColor: '#8B5CF6',
          iconBg: '#EDE9FE',
          body:
            'We do not sell or rent your personal data.\n\nInformation may be shared only with:\n\n• Payment processors (Razorpay) for transactions.\n\n• Legal authorities when required by law.',
        },
        {
          title: '4. Data Security',
          icon: Lock,
          iconColor: '#DC2626',
          iconBg: '#FEE2E2',
          body:
            'We use encryption and trusted services like Razorpay to protect your data. No online platform is 100% secure — please use the app responsibly.',
        },
        {
          title: '5. Your Rights',
          icon: UserCheck,
          iconColor: '#059669',
          iconBg: '#D1FAE5',
          body:
            'You can:\n\n• Request correction or deletion of your data.\n\n• Opt out of promotional notifications.\n\nFor privacy concerns, email us at yottascore@gmail.com',
        },
        {
          title: "6. Children's Privacy",
          icon: Baby,
          iconColor: '#EC4899',
          iconBg: '#FCE7F3',
          body:
            'Yottascore is for students above 13 years of age. Users under 18 should use the app with parental guidance.',
        },
        {
          title: '7. Changes to This Policy',
          icon: RefreshCw,
          iconColor: '#0891B2',
          iconBg: '#CFFAFE',
          body:
            'We may update this Privacy Policy periodically. Updates will be posted in the app or on our website.',
        },
      ]}
    />
  );
}
