import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api"; // Your real Axios instance
import { jwtDecode } from "jwt-decode"; // Import the decoder

// Define the structure of our token
interface DecodedToken {
  uid: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // --- This is now a REAL API call ---
      const res = await API.post("/auth/login", { email, password });
      const { token } = res.data;

      // 1. Decode the token to check the user's role
      const decoded = jwtDecode<DecodedToken>(token);
      
      // 2. CRITICAL: Check if the user is an admin ("organizer")
      if (decoded.role !== "organizer") {
        setError("Access Denied: This portal is for admins only.");
        setLoading(false);
        return; // Stop the login
      }
      
      // 3. Role is valid, save the token and navigate
      localStorage.setItem("token", token);
      
      // Navigate to dashboard
      navigate("/dashboard");

    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow-md w-80"
      >
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border border-gray-300 p-2 mb-3 rounded focus:outline-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border border-gray-300 p-2 mb-4 rounded focus:outline-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-all disabled:bg-gray-400"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-center mt-4">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}



// //2nd version - dev mode with mocked login

// import { useState } from "react";
// import { useNavigate, Link } from "react-router-dom"; // Import Link
// // We don't need the real API for this mock
// // import API from "../services/api.ts"; 

// export default function LoginPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const navigate = useNavigate(); // Use the useNavigate hook

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       // --- FOR DEVELOPMENT ONLY ---
//       // We are commenting out the real API call
//       // const res = await API.post("/auth/login", { email, password });

//       // And pretending we got a successful response
//       console.log("--- DEV MODE: Faking login & creating mock token ---");
//       localStorage.setItem("token", "fake-dev-token-12345");
      
//       // --- END DEV ONLY SECTION ---


//       // Redirect to dashboard using navigate
//       navigate("/dashboard");
//     } catch (err: any) {
//       // This catch block won't be hit in dev mode, but we leave it for when you uncomment the real API call
//       setError(err.response?.data?.message || "Invalid credentials");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <form
//         onSubmit={handleLogin}
//         className="bg-white p-6 rounded-xl shadow-md w-80"
//       >
//         <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
//           Admin Login
//         </h1>

//         <input
//           type="email"
//           placeholder="Email"
//           className="w-full border border-gray-300 p-2 mb-3 rounded focus:outline-blue-500"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />

//         <input
//           type="password"
//           placeholder="Password"
//           className="w-full border border-gray-300 p-2 mb-4 rounded focus:outline-blue-500"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />

//         {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-all disabled:bg-gray-400"
//         >
//           {loading ? "Logging in..." : "Login"}
//         </button>

//         <p className="text-sm text-center mt-4">
//           Don’t have an account?{" "}
//           {/* Use Link component for client-side navigation */}
//           <Link to="/signup" className="text-blue-600 hover:underline">
//             Sign Up
//           </Link>
//         </p>
//       </form>
//     </div>
//   );
// }


// // 1st version

// import { useState } from "react";
// import API from "../services/api";

// export default function LoginPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       const res = await API.post("/auth/login", { email, password });

//       // Save token to local storage
//       localStorage.setItem("token", res.data.token);

//       // Redirect to dashboard
//       window.location.href = "/dashboard";
//     } catch (err: any) {
//       setError(err.response?.data?.message || "Invalid credentials");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <form
//         onSubmit={handleLogin}
//         className="bg-white p-6 rounded-xl shadow-md w-80"
//       >
//         <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
//           Admin Login
//         </h1>

//         <input
//           type="email"
//           placeholder="Email"
//           className="w-full border border-gray-300 p-2 mb-3 rounded focus:outline-blue-500"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />

//         <input
//           type="password"
//           placeholder="Password"
//           className="w-full border border-gray-300 p-2 mb-4 rounded focus:outline-blue-500"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />

//         {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-all disabled:bg-gray-400"
//         >
//           {loading ? "Logging in..." : "Login"}
//         </button>

//         <p className="text-sm text-center mt-4">
//           Don’t have an account?{" "}
//           <a href="/signup" className="text-blue-600 hover:underline">
//             Sign Up
//           </a>
//         </p>
//       </form>
//     </div>
//   );
// }
