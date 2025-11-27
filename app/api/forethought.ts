"use server";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";
import { getEmailAndPassword, logout } from "./auth";

export async function forethoughtAuth({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const cognitoClientId = process.env.COGNITO_CLIENT_ID;
  const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  if (!cognitoClientId || !cognitoUserPoolId) {
    throw new Error("Cognito client ID or user pool ID is not set");
  }

  // Create Cognito user pool and user
  const poolData = {
    UserPoolId: cognitoUserPoolId,
    ClientId: cognitoClientId,
  };

  const userPool = new CognitoUserPool(poolData);
  const userData = {
    Username: email,
    Pool: userPool,
  };

  const cognitoUser = new CognitoUser(userData);
  const authenticationData = {
    Username: email,
    Password: password,
  };

  const authenticationDetails = new AuthenticationDetails(authenticationData);

  // Authenticate and get tokens
  const idToken = await new Promise<string | null>((resolve) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        resolve(result.getIdToken().getJwtToken());
      },
      onFailure: (err) => {
        console.error("✗ Cognito authentication failed:", err);
        resolve(null);
      },
    });
  });

  if (!idToken) {
    throw new Error("Failed to get ID token");
  }

  return `Bearer ${idToken}`;
}

export async function forethoughtFetch(url: string, options: RequestInit = {}) {
  const bearerToken = await forethoughtAuth(await getEmailAndPassword());

  if (!bearerToken) {
    throw new Error("Failed to get token");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      authorization: bearerToken,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  if (response.status === 403) {
    console.error("403 Forbidden, logging out");
    await logout();
  }

  return response;
}
