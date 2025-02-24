import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../../server/src/firebaseConfig";
import React from "react";

export const registerUser = async (
  firstName: string,
  lastName: string,
  email: string,
  phoneNumber: string,
  password: string,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    setLoading(true);
    // create a new user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const results = userCredential.user;
    console.log(results);
    // send an email verification to the user's email
    await sendEmailVerification(results);
    alert(
      `A verification email has been sent to your email address ${firstName}`
    );
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }

  console.log(firstName);
  console.log(lastName);
  console.log(email);
  console.log(phoneNumber);
  console.log(password);
};
