// This is where we will directly interact with the firestore database
import app from "./firebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { User } from "./api";

const db = getFirestore(app);

// Various tables / collections in the database
const usersCollection = collection(db, "Users");
const feedbackCollection = collection(db, "Feedback");
const RideRequestsCollection = collection(db, "RideRequests");
const ProblematicUsersCollection = collection(db, "ProblematicUsers");

// Adds a user to the database
export async function createUser(user: User) {
  // If we did want to add a timestamp to the user object, we could do it like this
  // const dbData = {
  //   createdAt: Timestamp.now(),
  //   ...user
  // };

  // setDoc will check if the document already exists and not add it if it does
  // use the net id of the user as the document id
  return await setDoc(doc(db, "Users", user.netid), user);
}

// TODO: Get rid of these functions or modify them to fit our needs
// GREAT RESOURCE FOR BASIC FIRESTORE WORK: https://www.youtube.com/watch?v=kwVbKV0ZFEs

// Example of how to update an entry in the database
// In this case, we are updating the name of the user with the given netid
export async function updateUser(netid: string, name: string) {
  const docRef = doc(usersCollection, netid); // get the document by id
  return await updateDoc(docRef, { name });
}

// Example of how to delete an entry in the database
// In this case, we are deleting the user with the given netid
export async function deleteUser(netid: string) {
  const docRef = doc(usersCollection, netid); // get the document by id
  return await deleteDoc(docRef);
}

// Example of how to query the database
// In this case, we are querying for all users with the given name
export async function queryUsers(name: string) {
  const queryName = query(usersCollection, where("name", "==", name));
  return await getDocs(queryName);
}
