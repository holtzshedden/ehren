"use client";

import React from "react";
import { SignIn, useUser } from "@clerk/nextjs";

const UNAUTHORIZED_REDIRECT = "https://dev.ehrendrinks.de/";

export default function BackendGate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isLoaded, isSignedIn, user } = useUser();

  const hasBackendAccess =
    user?.publicMetadata?.ehrenmann === true;

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn || hasBackendAccess) {
      return;
    }

    window.location.replace(UNAUTHORIZED_REDIRECT);
  }, [isLoaded, isSignedIn, hasBackendAccess]);

  if (!isLoaded) {
    return (
      <main className="backend-auth-screen">
        <div className="backend-auth-loading">
          EHRENFELD
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="backend-auth-screen">
        <div className="backend-auth-brand">
          <span>EHREN</span>
          <span>FELD</span>
          <small>ERP</small>
        </div>

        <SignIn
          routing="hash"
          fallbackRedirectUrl="/backend"
          signUpUrl={undefined}
        />
      </main>
    );
  }

  if (!hasBackendAccess) {
    return (
      <main className="backend-auth-screen">
        <div className="backend-auth-loading">
          Zugriff wird geprüft …
        </div>
      </main>
    );
  }

  return <>{children}</>;
}