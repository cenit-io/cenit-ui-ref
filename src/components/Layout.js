import IconButton from "@material-ui/core/IconButton";
import BackIcon from "@material-ui/icons/KeyboardBackspace";
import React, { useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { makeStyles } from "@material-ui/core";
import { HOME } from "./routes";
// import Plans from "./Plans";
import { Switch, Route } from "react-router-dom";

const H = 6;

const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
        paddingTop: theme.spacing(H)
    },
    appBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: theme.spacing(H),
    },
    container: {
        height: `calc(100vh - ${theme.spacing(H)}px)`,
        overflow: 'auto'
    }
}));

export default function Layout() {

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <div className={classes.container}>
                <div className="flex justify-content-center align-items-center relative">
                    <p>Rereference</p>
                    <ul>
                        <li>Docs</li>
                        <li>Roadmap</li>
                        <li>Suggest a feature</li>
                        <li>Report an issue</li>
                    </ul>

                </div>
            </div>
        </div>
    );
}
