import { Redirect } from "expo-router";
const Loading = () => {
  // Simple oauthredirect, no UI, but it redirects back to signin to catch
  // the Google response object from the signin (something we were missing previously)
  return <Redirect href={{ pathname: "/(student)/signin" }}></Redirect>;
};

export default Loading;
