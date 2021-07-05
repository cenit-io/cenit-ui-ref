import React, { useEffect, useState } from 'react';
import QueryString from 'querystring';
import AuthorizationService from "./services/AuthorizationService";
import ErrorBoundary from "./components/ErrorBoundary";
import { catchError } from "rxjs/operators";
import { of } from "rxjs";
import './common/FlexBox.css';
import { BrowserRouter, Switch, Route } from "react-router-dom";
import SubscriptionContext from "./components/SubscriptionContext";
import { ALERT, HOME, PAYMENT_METHOD, PLANS, SUBSCRIBE, UNSUBSCRIBE } from "./components/routes";
import Subscribe from "./components/Subscribe";
import Layout from "./components/Layout";
import Alert from "./components/Alert";
import LinearProgress from "@material-ui/core/LinearProgress";

function App() {

    const [authorizing, setAuthorizing] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (authorizing) {

            const params = QueryString.parse(window.location.search.slice(1, window.location.search.length));

            AuthorizationService.token = params.token;

            const subscription = AuthorizationService.getAccess().pipe(
                catchError(() => {
                    setError(true);
                    return of(null);
                })
            ).subscribe(
                access => access && setAuthorizing(false)
            );

            return () => subscription.unsubscribe();
        }
    }, [authorizing]);


    if (error) {
        return <ErrorBoundary/>
    }

    if (authorizing) {
        return <LinearProgress className="full-width"/>;
    }

    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Switch>
                    <Route path={ALERT}>
                        <Alert/>
                    </Route>
                    <Route path='/'>
                        <SubscriptionContext>
                            <Layout/>
                        </SubscriptionContext>
                    </Route>
                </Switch>
            </ErrorBoundary>
        </BrowserRouter>
    );
}

export default App;
