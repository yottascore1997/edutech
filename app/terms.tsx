import LegalDocumentScreen from '@/components/legal/LegalDocumentScreen';
import {
  AlertTriangle,
  Ban,
  FileText,
  Gavel,
  IndianRupee,
  Lightbulb,
  Mail,
  RefreshCw,
  Smartphone,
} from 'lucide-react-native';

export default function TermsScreen() {
  return (
    <LegalDocumentScreen
      badge="LEGAL"
      title="Terms &"
      titleAccent="Conditions"
      subtitle="Rules for using Yottascore exams and rewards"
      headerIcon={FileText}
      intro="By accessing or using the Yottascore app, you agree to these terms and conditions. Please read them carefully."
      contactEmail="yottascore@gmail.com"
      sections={[
        {
          title: '1. Use of the App',
          icon: Smartphone,
          iconColor: '#6344D4',
          iconBg: '#EDE9FE',
          body:
            '• Yottascore lets you take live exams, practice tests, and quizzes (including paid battle quizzes).\n\n• You must provide accurate personal details (name, number, email).\n\n• You confirm you are a school/college student or above 13 years old.',
        },
        {
          title: '2. Entry Fees and Rewards',
          icon: IndianRupee,
          iconColor: '#7C3AED',
          iconBg: '#F3E8FF',
          body:
            '• Some quizzes or exams require an entry fee via Razorpay.\n\n• Winners receive cash rewards or scholarships credited to their wallet or registered account.\n\n• **Entry fees are non-refundable** once the exam or quiz has started.',
        },
        {
          title: '3. Fair Play Policy',
          icon: Gavel,
          iconColor: '#8B5CF6',
          iconBg: '#EDE9FE',
          body:
            '• Do not use multiple accounts, unfair means, or third-party tools.\n\n• Cheating or misuse may lead to account suspension and loss of winnings.',
        },
        {
          title: '4. Intellectual Property',
          icon: Lightbulb,
          iconColor: '#059669',
          iconBg: '#D1FAE5',
          body:
            'All app content (questions, design, and code) belongs to Yottascore and may not be copied or reused without permission.',
        },
        {
          title: '5. Limitation of Liability',
          icon: AlertTriangle,
          iconColor: '#D97706',
          iconBg: '#FFEDD5',
          body:
            'Yottascore is not responsible for:\n\n• Network issues or technical delays.\n\n• Incorrect information submitted by users.\n\n• Any indirect or accidental loss.',
        },
        {
          title: '6. Account Termination',
          icon: Ban,
          iconColor: '#DC2626',
          iconBg: '#FEE2E2',
          body:
            'We may suspend or delete accounts that violate rules or engage in fraudulent activity.',
        },
        {
          title: '7. Updates to Terms',
          icon: RefreshCw,
          iconColor: '#0891B2',
          iconBg: '#CFFAFE',
          body:
            'We may update these Terms from time to time. Continued use of the app after changes means you accept the new terms.',
        },
        {
          title: '8. Contact',
          icon: Mail,
          iconColor: '#6344D4',
          iconBg: '#EDE9FE',
          body: 'For any issues, contact us at:\n\nyottascore@gmail.com',
        },
      ]}
    />
  );
}
