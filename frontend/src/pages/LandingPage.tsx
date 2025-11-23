import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpenIcon,
  MapIcon,
  BoltIcon,
  LockClosedIcon,
  QrCodeIcon,
  BriefcaseIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpenIcon className="h-8 w-8 text-yellow-600 mr-2" />
              <h1 className="text-2xl font-bold text-yellow-600">
                Book Fair Stalls
              </h1>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-yellow-600 hover:text-yellow-700 font-medium transition">
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition shadow-md">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Welcome to{" "}
            <span className="text-yellow-600">
              Colombo International Book Fair
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Reserve your perfect stall location and showcase your books to
            thousands of book lovers
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-4 bg-yellow-600 text-white text-lg rounded-xl hover:bg-yellow-700 font-semibold transition shadow-lg transform hover:scale-105">
              Reserve Your Stall Now
            </button>
            <button
              onClick={() => navigate("/stallmap")}
              className="px-8 py-4 bg-white text-yellow-600 text-lg rounded-xl hover:bg-gray-50 font-semibold transition shadow-lg border-2 border-yellow-600">
              View Stall Map
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Why Choose Our Platform?
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2">
            <MapIcon className="h-12 w-12 text-yellow-600 mb-4" />
            <h4 className="text-xl font-bold text-gray-800 mb-3">
              Interactive Stall Map
            </h4>
            <p className="text-gray-600">
              Browse and select your ideal stall location with our easy-to-use
              interactive map interface
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2">
            <BoltIcon className="h-12 w-12 text-yellow-600 mb-4" />
            <h4 className="text-xl font-bold text-gray-800 mb-3">
              Instant Booking
            </h4>
            <p className="text-gray-600">
              Quick and seamless reservation process with real-time availability
              updates
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2">
            <LockClosedIcon className="h-12 w-12 text-yellow-600 mb-4" />
            <h4 className="text-xl font-bold text-gray-800 mb-3">
              Secure & Reliable
            </h4>
            <p className="text-gray-600">
              Your reservations are safe with our secure payment and booking
              system
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2">
            <QrCodeIcon className="h-12 w-12 text-yellow-600 mb-4" />
            <h4 className="text-xl font-bold text-gray-800 mb-3">
              Digital QR Codes
            </h4>
            <p className="text-gray-600">
              Receive instant QR codes for easy check-in and stall management
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2">
            <BriefcaseIcon className="h-12 w-12 text-yellow-600 mb-4" />
            <h4 className="text-xl font-bold text-gray-800 mb-3">
              Publisher Dashboard
            </h4>
            <p className="text-gray-600">
              Manage all your stall reservations from one convenient dashboard
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-2">
            <EnvelopeIcon className="h-12 w-12 text-yellow-600 mb-4" />
            <h4 className="text-xl font-bold text-gray-800 mb-3">
              Email Notifications
            </h4>
            <p className="text-gray-600">
              Stay updated with booking confirmations and important updates via
              email
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-yellow-600 py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">25+</div>
              <div className="text-xl">Available Stalls</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-xl">Publishers Registered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-xl">Online Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
          How It Works
        </h3>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-yellow-600">
              1
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Create Account</h4>
            <p className="text-gray-600">Sign up with your publisher details</p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-yellow-600">
              2
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Browse Stalls</h4>
            <p className="text-gray-600">
              View available stalls on the interactive map
            </p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-yellow-600">
              3
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Reserve & Pay</h4>
            <p className="text-gray-600">
              Select your stall and complete the booking
            </p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-yellow-600">
              4
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Get QR Code</h4>
            <p className="text-gray-600">
              Receive your stall access QR code via email
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-yellow-500 to-orange-500 py-16 mt-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Reserve Your Stall?
          </h3>
          <p className="text-xl text-white mb-8">
            Join hundreds of publishers at the Colombo International Book Fair
          </p>
          <button
            onClick={() => navigate("/register")}
            className="px-10 py-4 bg-white text-yellow-600 text-lg rounded-xl hover:bg-gray-100 font-bold transition shadow-xl transform hover:scale-105">
            Start Your Journey Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 Colombo International Book Fair. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;