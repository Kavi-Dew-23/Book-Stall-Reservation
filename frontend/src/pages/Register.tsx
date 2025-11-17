import React, { useState } from "react";
// import axios from "axios";
import RegisterImage from "../assets/RegisterImage.svg";
import Facebook from "../assets/Facebook.svg";
import Google from "../assets/Google.svg";
import Apple from "../assets/Apple.svg";
import API from "../api";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Passwords do not match");
      return;
    }

    try {
      const response = await API.post(
        "/auth/register",
        formData
      );
      setMessage("✅ " + response.data.message);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error(error);
      setMessage(
        "❌ " + (error.response?.data?.message || "Registration failed")
      );
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left section */}
      <div className="w-1/3 flex items-center justify-center">
        <img
          src={RegisterImage}
          alt="Register Image"
          className="max-w-full h-auto object-contain"
        />
      </div>

      {/* Right section */}
      <div className="w-2/3 flex flex-col justify-center items-center px-10">
        <h1 className="text-3xl font-bold text-yellow-600 mb-2 text-center">
          Welcome to Colombo International Book Fair
        </h1>
        <p className="text-sm text-gray-300 mb-2">
          Let’s get you set up so you can access your personal account.
        </p>
        <h2 className="text-2xl font-bold text-amber-500 mb-6">
          Sign Up your Account
        </h2>

        {message && (
          <p
            className={`mb-4 font-medium ${
              message.startsWith("✅") ? "text-green-500" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        <form className="w-full p-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-8 mb-8">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              className="p-3 rounded bg-amber-200 text-gray-900 placeholder-gray-700 focus:outline-none"
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              className="p-3 rounded bg-amber-200 text-gray-900 placeholder-gray-700 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="p-3 rounded bg-amber-200 text-gray-900 placeholder-gray-700 focus:outline-none"
              required
            />
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="p-3 rounded bg-amber-200 text-gray-900 placeholder-gray-700 focus:outline-none"
              required
            />
          </div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 rounded bg-amber-200 text-gray-900 placeholder-gray-700 focus:outline-none mb-8"
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full p-3 rounded bg-amber-200 text-gray-900 placeholder-gray-700 focus:outline-none mb-8"
            required
          />

          <label className="flex text-sm space-x-2 text-gray-300">
            <input type="checkbox" name="agree" required />
            <span>I agree to all the Terms and Privacy Policies</span>
          </label>

          <button
            type="submit"
            className="w-full bg-yellow-600 hover:bg-yellow-700 rounded-xl mt-4 p-3"
          >
            Create Account
          </button>

          <div className="text-center mt-5 text-gray-300">
            <p>
              Already have an Account?{" "}
              <a href="/login" className="text-amber-300 hover:underline">
                Login
              </a>
            </p>
            <p className="mt-3 text-gray-400">Or Sign Up With</p>
            <div className="flex justify-center gap-6 mt-4 items-center">
              {[Facebook, Google, Apple].map((icon, index) => (
                <button
                  key={index}
                  type="button"
                  className="bg-amber-100 p-3 rounded-lg cursor-pointer w-lg flex justify-center items-center hover:bg-amber-200"
                >
                  <img
                    src={icon}
                    alt="Social Login"
                    className="h-6 w-6 object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;