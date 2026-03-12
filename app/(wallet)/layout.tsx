import { WalletProvider } from "@/components/WalletProvider";

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <div className="mx-auto min-h-screen max-w-md px-4 py-6">
        {children}
      </div>
    </WalletProvider>
  );
}
