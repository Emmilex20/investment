// client/src/components/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-900 border-t border-pi-accent/10 mt-12">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center flex-wrap">
                    
                    {/* Branding / Copyright */}
                    <div className="mb-4 sm:mb-0">
                        <p className="text-gray-400 text-sm">
                            &copy; {new Date().getFullYear()} P$ Invest. All rights reserved.
                        </p>
                    </div>
                    
                    {/* Navigation Links */}
                    <div className="flex space-x-6 text-sm">
                        <Link to="/about" className="text-gray-400 hover:text-white transition duration-200">About</Link>
                        <Link to="/terms" className="text-gray-400 hover:text-white transition duration-200">Terms of Service</Link>
                        <Link to="/privacy" className="text-gray-400 hover:text-white transition duration-200">Privacy Policy</Link>
                        <Link to="/contact" className="text-gray-400 hover:text-white transition duration-200">Contact</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;