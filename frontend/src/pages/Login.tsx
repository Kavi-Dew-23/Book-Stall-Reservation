// import React, { useState } from "react";
// import LoginImage from "../assets/Login.svg";
// import Google from "../assets/Google.svg";
// import axios from "axios";

// const Login: React.FC = () => {
//     const [formData, setFormData] = useState({email: "", password: ""});
//     const [message, setMessage] = useState("");
//     const [isError, setIsError] = useState(false);

//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value});
//     };

//     const handleSubmit = async(e: React.FormEvent) => {
//         e.preventDefault();
//         setMessage("");
//         setIsError(false);

//         try{
//             //login and get token
//             const res = await axios.post("http://localhost:5000/api/auth/login",formData);
//             const {token, role} = res.data;
    
//             localStorage.setItem("token", token);
//             localStorage.setItem("role", role);
            
//             setMessage("Login Successful");
//             setIsError(false); // success message
//             console.log("token", token);

            
//             if(role === "publisher") {
//                 window.location.href = "/publisher/home";
//             } else if(role === "organizer") {
//                 window.location.href = "/organizer";
//             }
//             // test of token works
//             const test = await axios.get("http://localhost:5000/api/auth/protected", {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             });
//             console.log("Protected route response", test.data);
//         } catch (err: any) {
//             console.error(err);
//             setMessage(err.response?.data?.message || "Login failed");
//             setIsError(true);
//         }
//     };

//     return(
//         <div className="flex min-h-screen w-full bg-black text-white m-0 p-0 overflow-hidden">
//             {/**Left section of the image */}
//             <div className="flex-[0.55] flex items-center justify-start bg-black overflow-hidden">
//                 <img src={LoginImage}
//                 alt="Login Image"
//                 className="h-screen object-contain block"/>

//             </div>
//             {/**Right section of the image */}
//             <div className="flex-[0.50] flex flex-col justify-center items-center px-10">
//                 <h1 className="text-3xl font-bold text-yellow-600 mb-2 text-center">
//                     Welcome to Colombo International BookFair
//                 </h1>
//                 <p className="text-gray-300 text-sm mb-6 text-center max-w-md">
//                     Discover a seamless way to sell your books and unlock exclusive
//                     benefits. Enjoy a hassle-free experience, save valuable time, and take
//                     advantage of our amazing offers.
//                 </p>
//                 <h2 className="text-2xl font-bold text-yellow-600 mb-6 text-center">
//                     Login to Your Account!
//                 </h2>
//                 {/**Login form */}
//                 <form className="w-full max-w-md space-y-4" onSubmit={handleSubmit}>
//                     <div className="relative">
//                         <input
//                         type="email"
//                         name="email"
//                         placeholder="Enter Email"
//                         value={formData.email}
//                         onChange={handleChange}
//                         className="w-full p-3 pl-4 rounded-lg bg-yellow-800/30 border-none focus:ring-2 focus:ring-yellow-600 text-white placeholder-gray-400"
//                         />
//                     </div>
//                     <div className="relative">
//                         <input 
//                         type="password"
//                         name="password"
//                         placeholder="Enter Password"
//                         value={formData.password}
//                         onChange={handleChange}
//                         className="w-full p-3 pl-4 rounded-lg bg-yellow-800/30 border-none focus:ring-2 focus:ring-yellow-600 text-white placeholder-gray-400"/>
                        

//                     </div>
//                     <div className="flex justify-end">
//                         <a href=""
//                         className="text-sm text-yellow-500 hover:underline mb-2">
//                             Forgot Password?
//                         </a>

//                     </div>
                    
                
//                 <div className="w-full max-w-md flex flex-col items-center mt-6">
//                     <p className="text-sm text-gray-300">Don't have an account{" "}
//                     <a href="/"
//                     className="text-yellow-500 hover:underline font-semibold">
//                         Create an account
//                         </a>
//                     </p>
//                     <hr className="w-full my-4 border-gray-600" />
//                     <button className="w-full bg-yellow-600 hover:bg-yellow-700 rounded-full py-2 text-lg font-semibold mt-2"
//                     type="submit">
//                         Login
//                     </button>
//                     {message && <p
//                 className={`text-center mt-3 font-semibold ${
//                   isError ? "text-red-400" : "text-green-400"
//                 }`}
//                  >{message}</p>}
//                 </div>
//                 {/**Google login */}
//                 <button className="w-full flex items-center gap-3 text-black px-6 rounded-full justify-center">
//                     <img src={Google}
//                     alt="Google Image"
//                     className="cursor-pointer"/>
//                     <span className="text-sm font-medium text-gray-300">Login with Google</span>
//                 </button>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default Login;

import React, { useState } from "react";
import LoginImage from "../assets/Login.svg";
import Google from "../assets/Google.svg";
import axios from "axios";

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const API = import.meta.env.VITE_API_URL;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    try {
      // login and get token
      const res = await axios.post(`${API}/api/auth/login`, formData);
      const { token, role } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      setMessage("Login Successful");
      setIsError(false);

      if (role === "publisher") {
        window.location.href = "/publisher/home";
      } else if (role === "organizer") {
        window.location.href = "/organizer";
      }

      // Test protected route
      const test = await axios.get(`${API}/api/auth/protected`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Protected route response:", test.data);
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.message || "Login failed");
      setIsError(true);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-black text-white m-0 p-0 overflow-hidden">
      {/* Left section */}
      <div className="flex-[0.55] flex items-center justify-start overflow-hidden">
        <img src={LoginImage} alt="Login" className="h-screen object-contain block" />
      </div>

      {/* Right section */}
      <div className="flex-[0.50] flex flex-col justify-center items-center px-10">
        <h1 className="text-3xl font-bold text-yellow-600 mb-2 text-center">
          Welcome to Colombo International BookFair
        </h1>

        <form className="w-full max-w-md space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 pl-4 rounded-lg bg-yellow-800/30 placeholder-gray-400"
          />

          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 pl-4 rounded-lg bg-yellow-800/30 placeholder-gray-400"
          />

          <button
            className="w-full bg-yellow-600 hover:bg-yellow-700 rounded-full py-2 text-lg font-semibold mt-2"
            type="submit"
          >
            Login
          </button>

          {message && (
            <p
              className={`text-center mt-3 font-semibold ${
                isError ? "text-red-400" : "text-green-400"
              }`}
            >
              {message}
            </p>
          )}
        </form>

        <button className="w-full flex items-center gap-3 text-black px-6 rounded-full justify-center mt-6">
          <img src={Google} alt="Google" />
          <span className="text-sm font-medium text-gray-300">Login with Google</span>
        </button>
      </div>
    </div>
  );
};

export default Login;
