import React from "react";
import { Profile } from "../../assets/Profile.jsx";
import { Key} from "../../assets/Key.jsx";
import Google from "../../assets/Google.jsx"
import Facebook from "../../assets/Facebook.jsx";
import "./login_style.css";

const Login = () => {
  return (
    <main className="login">
      <section className="frame">
        <button className="login-button">
        <div className="div-wrapper">
          <h1 className="text-wrapper">Login</h1>
        </div>
        </button>
        <p className="don-t-have-an">
          <span className="span">Don&#39;t have an account yet? </span>
          <a href="/register" className="text-wrapper-2">
            Register
          </a>
        </p>
      </section>

      <section className="overlap">
  <div className="input-wrapper">
    <Profile className="design-component-instance-node input-icon" />
    <input
      id="username"
      type="text"
      className="text-input"
      placeholder="Username"
    />
  </div>

  <div className="input-wrapper">
    <Key
 className="design-component-instance-node input-icon" />
    <input
      id="password"
      type="password"
      className="text-input"
      placeholder="Password"
    />
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
    </main>
  );
};

export default Login;