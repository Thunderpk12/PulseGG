// Register is handled inside login.tsx as the "Register" tab.
// This file redirects so any deep link to /register still works.
// register.tsx — The full registration UI lives inside login.tsx (tab-based).
// This stub redirects to the login screen which contains the Register tab.
import { Redirect } from 'expo-router';

export default function RegisterScreen() {
  return <Redirect href="/(auth)/login" />;
}
