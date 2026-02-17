import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams; // unwrap
  const { token, email } = params || {};

  return <ResetPasswordForm token={token} email={email} />;
}

