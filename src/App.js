import React from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Layout from "./components/Layout";
import './common/FlexBox.css';

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
