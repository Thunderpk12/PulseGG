// Register is handled inside login.tsx as the "Register" tab.
// This file redirects so any deep link to /register still works.
import { Redirect } from 'expo-router';
export default function RegisterScreen() {
  return <Redirect href="/(auth)/login" />;
}
