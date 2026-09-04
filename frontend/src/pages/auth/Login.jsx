import { AuthLayout } from "../../components/auth/AuthLayout.jsx";
import { EmailCodeForm } from "../../components/auth/EmailCodeForm.jsx";

// Identical to Signup by design — /auth/verify-code is one call for both, so
// the form branches on whether the account is new, not on which URL you
// arrived at. Keeping two thin files means the two URLs stay linkable.
export default function Login() {
  return (
    <AuthLayout>
      <EmailCodeForm />
    </AuthLayout>
  );
}
