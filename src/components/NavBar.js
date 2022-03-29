import React from "react";
import { makeStyles, Typography } from "@material-ui/core";

const LINKS = [
    { label: 'Docs', href: 'https://docs.cenit.io/' },
    { label: 'Roadmap', href: 'https://cenit.frill.co/roadmap' },
    { label: 'Suggest a feature', href: 'https://github.com/cenit-io/cenit/issues/new?assignees=&labels=&template=feature_request.md&title=' },
    { label: 'Report an issue', href: 'https://github.com/cenit-io/cenit/issues/new?assignees=&labels=&template=bug_report.md&title=' }
];

const H = 6;

const useStyles = makeStyles(theme => ({
    container: {
        height: `calc(100vh - ${theme.spacing(H)}px)`,
        overflow: 'auto'
    },
    li: {
        float: 'left'
    },
    a: {
        display: 'block',
        padding: '32px',
        backgroundColor: '#dddddd'
    }
}));

const NavItem = ({ item }) => {
    const classes = useStyles();
    return (
        <li className={classes.li}><a className={classes.a} href={item.href}>{item.label}</a></li>
    );
};

export default function NavBar() {

    const classes = useStyles();

    return (
        <div className={classes.container}>
            <div className="flex column justify-content-center align-items-center relative">
                <Typography variant="h5">Reference</Typography>
                <ul style={{ listStyleType: 'none', margin: 0, padding: 0, overflow: 'hidden' }}>
                    {LINKS.map(i => <NavItem key={i.label} item={i} />)}
                </ul>
            </div>
        </div>
    );
}
