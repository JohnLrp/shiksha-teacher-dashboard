import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "../styles/changePassword.css";
import api from "../api/apiClient";

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [validation, setValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecial: false,
    hasLower: false,
    hasUpper: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "newPassword") {
      setValidation({
        minLength: value.length >= 8,
        hasNumber: /[0-9]/.test(value),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        hasLower: /[a-z]/.test(value),
        hasUpper: /[A-Z]/.test(value),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const allValid = Object.values(validation).every((v) => v);
    if (!allValid) {
      setMessage({ type: "error", text: "Please meet all password requirements" });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (!formData.oldPassword) {
      setMessage({ type: "error", text: "Please enter your old password" });
      return;
    }

    try {
      setLoading(true);
      await api.post("/accounts/change-password/", {
        old_password: formData.oldPassword,
        new_password: formData.newPassword,
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setValidation({
        minLength: false,
        hasNumber: false,
        hasSpecial: false,
        hasLower: false,
        hasUpper: false,
      });
    } catch (err) {
      const data = err.response?.data;
      const errorMsg =
        data?.old_password?.[0] ||
        data?.new_password?.[0] ||
        data?.detail ||
        "Failed to change password. Please try again.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="changePassword">
      <div className="changePassword__card">
        <h2 className="changePassword__title">Change Password</h2>

        <form onSubmit={handleSubmit} className="changePassword__form">
          {message.text && (
            <div className={`changePassword__message changePassword__message--${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="changePassword__field">
            <label className="changePassword__label">Old Password</label>
            <div className="changePassword__inputWrapper">
              <input
                type={showPassword.oldPassword ? "text" : "password"}
                className="changePassword__input"
                value={formData.oldPassword}
                onChange={(e) => handleChange("oldPassword", e.target.value)}
              />
              <button
                type="button"
                className="changePassword__eyeBtn"
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    oldPassword: !prev.oldPassword,
                  }))
                }
              >
                {showPassword.oldPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <div className="changePassword__field">
            <label className="changePassword__label">New Password</label>
            <div className="changePassword__inputWrapper">
              <input
                type={showPassword.newPassword ? "text" : "password"}
                className="changePassword__input"
                value={formData.newPassword}
                onChange={(e) => handleChange("newPassword", e.target.value)}
              />
              <button
                type="button"
                className="changePassword__eyeBtn"
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    newPassword: !prev.newPassword,
                  }))
                }
              >
                {showPassword.newPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            <ul className="changePassword__requirements">
              <li className={validation.minLength ? "valid" : ""}>Must be at least 8 character</li>
              <li className={validation.hasNumber ? "valid" : ""}>Must contain number (eg. 0-9)</li>
              <li className={validation.hasSpecial ? "valid" : ""}>Must contain character (eg. @#$%)</li>
              <li className={validation.hasLower ? "valid" : ""}>Must contain lowercase letter</li>
              <li className={validation.hasUpper ? "valid" : ""}>Must contain uppercase letter</li>
            </ul>
          </div>

          <div className="changePassword__field">
            <label className="changePassword__label">Confirm Password</label>
            <div className="changePassword__inputWrapper">
              <input
                type={showPassword.confirmPassword ? "text" : "password"}
                className="changePassword__input"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
              />
              <button
                type="button"
                className="changePassword__eyeBtn"
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    confirmPassword: !prev.confirmPassword,
                  }))
                }
              >
                {showPassword.confirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="changePassword__btn" disabled={loading}>
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}