import React, { useEffect, useState } from 'react';
import QueryString from 'querystring';
import ErrorBoundary from "./components/ErrorBoundary";
import { catchError } from "rxjs/operators";
import { of } from "rxjs";
import './common/FlexBox.css';
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { HOME, PLANS } from "./components/routes";
import Layout from "./components/Layout";
import LinearProgress from "@material-ui/core/LinearProgress";

function App() {

    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Switch>
                    <Route path='/'>
                        <Layout />
                    </Route>
                </Switch>
            </ErrorBoundary>
        </BrowserRouter>
    );
}

export default App;
