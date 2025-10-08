// client/src/components/AuthCard.tsx

import React from 'react';

interface AuthCardProps {
  title: string;
  children: React.ReactNode;
}

const AuthCard: React.FC<AuthCardProps> = ({ title, children }) => {
  return (
    <div className="bg-white/10 p-6 sm:p-10 rounded-xl shadow-2xl backdrop-blur-sm border border-pi-accent/50 w-full max-w-md mt-10">
      <h2 className="text-3xl font-bold text-pi-accent text-center mb-6 border-b border-pi-accent/30 pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
};

export default AuthCard;