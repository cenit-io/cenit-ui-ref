import React  from 'react';
import MaterialCard from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import CardActions from "@material-ui/core/CardActions";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    card: {
        width: theme.spacing(26),
        margin: theme.spacing(2)
    },
    title: {
        textAlign: 'center'
    },
    content: {
        marginTop: theme.spacing(2),
        textAlign: 'center'
    }
}));

export default function Box({ title, action, children}) {

    const classes = useStyles();

    return (
        <MaterialCard className={classes.card}>
            <CardContent>
                <Typography variant="h5" className={classes.title}>
                    {title}
                </Typography>
                <div className={classes.content}>
                    {children}
                </div>
            </CardContent>
            <CardActions className="justify-content-flex-end">
                {action}
            </CardActions>
        </MaterialCard>
    );
};
