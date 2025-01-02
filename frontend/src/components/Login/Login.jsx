import React from "react";
import { VuesaxLinear } from "../VuesaxLinear.jsx";
import { VuesaxLinearKey } from "../VuesaxLinearKey.jsx";
import CbiRoomsGym from "../../assets/CbiRoomsGym.jsx";
import Google from "../../assets/Google.jsx"
import Facebook from "../../assets/Facebook.jsx";
import EyeSlash from "../../assets/EyeSlash.jsx";
import "./style.css";

const Login = () => {
  return (
    <main className="login">
      <section className="frame">
        <div className="div-wrapper">
          <h1 className="text-wrapper">Login</h1>
        </div>
        <p className="don-t-have-an">
          <span className="span">Don&#39;t have an account yet? </span>
          <a href="/register" className="text-wrapper-2">
            Register
          </a>
        </p>
      </section>

      <section className="overlap">
        <div className="div">
          <div className="frame-2">
            <VuesaxLinear className="design-component-instance-node" />
            <label htmlFor="username" className="text-wrapper-3">
              Username
            </label>
          </div>

          <div className="frame-2">
            <VuesaxLinearKey className="design-component-instance-node" />
            <div className="frame-3">
              <label htmlFor="password" className="text-wrapper-4">
                Password
              </label>
            </div>
            <EyeSlash className="COCO-line-eye-slash"/>
          </div>
        </div>

        
      </section>

      <section className="frame-4">
        <p className="text-wrapper-5">Sign up with</p>
        <div className="frame-5">
          <button className="google-sign-in" aria-label="Sign up with Google">
            <div className="overlap-group">
              <Google className="google" />
              <span className="text-wrapper-6">Google</span>
            </div>
          </button>

          <button
            className="facebook-sign-in"
            aria-label="Sign up with Facebook"
          >
            <div className="overlap-2">
            <Facebook className="facebook" />
              <span className="text-wrapper-7">Facebook</span>
            </div>
          </button>
        </div>
      </section>

      <CbiRoomsGym className="cbi-roomsgym"/>
    </main>
  );
};

export default Login;