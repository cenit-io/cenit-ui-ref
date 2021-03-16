import React, { useEffect, useState } from 'react';
import QueryString from 'querystring';
import AuthorizationService  from "./services/AuthorizationService";
import { CircularProgress } from "@material-ui/core";
import ErrorBoundary from "./components/ErrorBoundary";
import { catchError } from "rxjs/operators";
import { of } from "rxjs";
import './common/FlexBox.css';
import Status from "./components/Status";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import CardForm from "./components/CardForm";
import SubscriptionContext from "./components/SubscriptionContext";
import Plans from "./components/Plans";
import { HOME, PAYMENT_METHOD, PLANS, SUBSCRIBE, UNSUBSCRIBE } from "./components/routes";
import Subscribe from "./components/Subscribe";
import Unsubscribe from "./components/Unsubscribe";
import Layout from "./components/Layout";

//API.onError(e => AuthorizationService.authorize());

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
        return <div className='flex full-width full-v-height justify-content-center align-items-center'>
            <CircularProgress/>
        </div>;
    }

    return (
        <BrowserRouter>
            <ErrorBoundary>
                <SubscriptionContext>
                    <Layout>
                        <div className="flex justify-content-center align-items-center relative">
                            <Switch>
                                <Route exact path={HOME}>
                                    <Status/>
                                </Route>
                                <Route path={PAYMENT_METHOD}>
                                    <CardForm/>
                                </Route>
                                <Route path={PLANS}>
                                    <Plans/>
                                </Route>
                                <Route path={SUBSCRIBE(':plan_id')}>
                                    <Subscribe/>
                                </Route>
                                <Route path={UNSUBSCRIBE(':plan_id')}>
                                    <Unsubscribe/>
                                </Route>
                            </Switch>
                        </div>
                    </Layout>
                </SubscriptionContext>
            </ErrorBoundary>
        </BrowserRouter>
    );
}

export default App;
