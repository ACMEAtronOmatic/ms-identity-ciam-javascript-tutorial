import React, {useEffect, useState} from 'react';

import fetch_retry from "fetch-retry";
import {useMsal} from "@azure/msal-react";
import {InteractionRequiredAuthError} from "@azure/msal-browser";


const fetch = fetch_retry(global.fetch);

const OnboardUserData = () => {
    const [userData, setUserData] = useState(null);
    const { instance, accounts } = useMsal();
    const [accessToken, setAccessToken] = useState(null);

    useEffect(() => {
        getAccessToken();
    }, []);

    function getAccessToken() {
        if (accounts.length > 0) {
            const request = {
                scopes: ["https://api.myradar.dev/devportal-api/Users.Onboard"],
                account: accounts[0]
            };
            instance.acquireTokenSilent(request).then(response => {
                setAccessToken(response.accessToken);
            }).catch(error => {
                // acquireTokenSilent can fail for a number of reasons, fallback to interaction
                if (error instanceof InteractionRequiredAuthError) {
                    instance.acquireTokenPopup(request).then(response => {
                        setAccessToken(response.accessToken);
                    });
                }
            });
        }
    }

    function handleOnboardClick() {
        const headers = {
            'Authorization': `Bearer ${accessToken}`
        }

        fetch(
            'https://onboarding.myradar.dev/onboarding', {
                headers: headers,
                retries: 10,
                retryDelay: (attempt, error, response) => Math.pow(2, attempt) * 1000
            })
            .then(response => response.json())
            .then(data =>
                setUserData(data));
    }

    return <div>
        <button onClick={handleOnboardClick}>Onboard User</button>
        {userData &&
            <>
                <p>Onboard API response</p>
                <code>
                    {JSON.stringify(userData)}
                </code>
            </>}
    </div>
};

export default OnboardUserData;