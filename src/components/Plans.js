import React, { useEffect } from 'react';
import AuthorizationService from "../services/AuthorizationService";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core";
import Box from "./Box";
import { useHistory } from "react-router-dom";
import { useSubscriptionContext } from "./SubscriptionContext";
import { map } from 'rxjs/operators';
import DollarIcon from "@material-ui/icons/AttachMoney";
import { useGoBack } from "./Layout";
import { SUBSCRIBE } from "./routes";

const useStyles = makeStyles(theme => ({
    card: {
        width: theme.spacing(24),
        marginB: theme.spacing(2)
    },
    title: {
        textAlign: 'center'
    },
    summary: {
        marginBottom: theme.spacing(2),
        textAlign: 'center'
    },
    amountBox: {
        display: 'flex',
        alignItems: 'center',
        borderRight: `solid 1px ${theme.palette.text.secondary}`,
        paddingRight: theme.spacing(1),
        marginRight: theme.spacing(1)
    },
    amount: {
        fontSize: theme.spacing(4)
    },
    details: {
        fontSize: theme.spacing(1),
        '& ul': {
            padding: 0,
            listStyleType: 'none',
            '& li': {
                marginBottom: theme.spacing(1)
            }
        }
    }
}));

export default function Plans() {

    useGoBack();

    const history = useHistory();

    const classes = useStyles();

    const [subscriptionState, setSubscriptionState] = useSubscriptionContext();

    const { plans } = subscriptionState;

    useEffect(() => {
        setSubscriptionState({
            observable: AuthorizationService.get('plans').pipe(
                map(plans => ({ plans }))
            )
        });
    }, []);

    const subscribe = id => () => history.push(SUBSCRIBE(id));

    const boxes = (plans || []).filter(({ subscribed }) => !subscribed).sort(
        (a, b) => a.amount - b.amount
    ).map(
        ({ id, nickname, summary, amount, interval, product }
        ) => (
            <Box key={`plan_${id}`}
                 title={nickname}
                 action={<Button onClick={subscribe(id)}>Let's go</Button>}>
                <CardContent component="div">
                    <Typography variant="body2" component="p" className={classes.summary}>
                        {summary}
                    </Typography>
                    <div className="flex">
                        <div className={classes.amountBox}>
                            <DollarIcon component="svg" className={classes.amount}/>
                            <span className={classes.amount}>{amount}</span>
                        </div>
                        <div className={classes.details}>
                            <ul>
                                <li>per {product.name}</li>
                                <li>per {interval}</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Box>
        ));

    return (
        <div className="flex wrap align-items-center justify-content-center">
            {boxes}
        </div>
    );
};
