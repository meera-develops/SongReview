

import { client_id } from '@env';

const clientId = client_id;
const redirectURI = 'http://localhost:8081/'
const authURL = new URL('https://accounts.spotify.com/authorize')

const scope = 'user-read-private user-read-email';

// PKCE standard for protecting the authorization code in mobile apps
// https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  }
  
const codeVerifier  = generateRandomString(64);
  


const sha256 = async (plain) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return window.crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
}
  

const hashed = sha256(codeVerifier)
const codeChallenge = base64encode(hashed);


window.localStorage.setItem('code_verifier', codeVerifier);

export async function userLogin() {
    let code = await getAuthCode();

    await getAccessToken(code);

    let accessToken = localStorage.getItem('access_token');
      
    const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
        Authorization: 'Bearer ' + accessToken
        }
    });
      
    const data = await response.json();
    console.log(data);
}


async function getAuthCode() {
    try {
        const params = {
            response_type: 'code',
            client_id: clientId,
            scope: scope,
            redirect_uri: redirectURI,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge
        };
        authURL.search = new URLSearchParams(params).toString();
        window.location.href = authURL.toString();

        constUrlParams = new URLSearchParams(window.location.search);
        let code = urlParams.get('code');

        const token = getAccessToken(); 

    } catch (err) {
        console.error('Failed to get authorization code. ', err);
    }
}

async function getAccessToken(code) {
    try {
        let codeVerifier = localStorage.getItem('code_verifier');

        const body = await fetch ({
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectURI,
                code_verifier: codeVerifier
            }),
        });

        const response = await body.json();
        localStorage.setItem('access_token', response.access_token);
    } catch (err) {
        console.error('Access token could not be retrieved.', err)
    }
}

