import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <SignUp
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
