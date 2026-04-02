import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#a855f7",
            colorBackground: "#18181b",
            colorInputBackground: "#27272a",
            colorInputText: "#fafafa",
          },
        }}
      />
    </div>
  );
}
