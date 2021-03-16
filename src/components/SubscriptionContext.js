import React, { useContext, useEffect } from 'react';
import { useSpreadState } from "../common/hooks";
import FrezzerLoader from "../components/FrezzerLoader";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import Button from "@material-ui/core/Button";
import DialogActions from "@material-ui/core/DialogActions";
import { Subject } from "rxjs";
import { catchError, map } from "rxjs/operators";

const SC = React.createContext({});

export function useSubscriptionContext() {
    return useContext(SC);
}

const useLoaderStyles = makeStyles(theme => ({
    backdrop: {
        background: theme.palette.background.paper
    }
}));

export default function SubscriptionContext({ children }) {

    const [state, setState] = useSpreadState({
        loading: false,
        onBack: new Subject()
    });

    const [confirmState, setConfirmState] = useSpreadState();

    const { confirmationSubject, confirmOptions } = confirmState;

    const classes = useLoaderStyles();

    const { loading, observable } = state;

    const context = [state, setState];

    const confirm = context.confirm = confirmOptions => {
        const confirmationSubject = new Subject();
        setConfirmState({
            confirmationSubject,
            confirmOptions: confirmOptions || {}
        });
        return confirmationSubject;
    };

    useEffect(() => {
        if (observable) {
            setState({ loading: true });
            const subscription = observable.pipe(
                catchError(e => {
                    if (e?.response?.status === 403) {
                        return confirm({
                            title: 'Ups!',
                            message: 'It seems your session expired!',
                            cancelable: false,
                            okText: 'Reload'
                        }).pipe(
                            map(() => {
                                window.location.reload();
                                return null;
                            })
                        );
                    }
                    const message = e?.message || 'An error occurred';
                    return confirm({
                        title: 'Alert',
                        message
                    })
                })
            ).subscribe(
                data => setState({ ...data, observable: null, loading: false })
            );

            return () => subscription.unsubscribe();
        }
    }, [observable]);

    const closeDialog = ok => () => {
        confirmationSubject?.next(ok);
        confirmationSubject.complete();
        setConfirmState({
            confirmationSubject: null,
            confirmOptions: null
        });
    };

    let dialogContent;
    if (confirmationSubject) {
        let { title, message, cancelText, okText } = confirmOptions;
        title = title && <DialogTitle>{title}</DialogTitle>;
        message = message && (
            <DialogContent>
                <DialogContentText component="div">
                    {message}
                </DialogContentText>
            </DialogContent>
        );
        dialogContent = (
            <>
                {title}
                {message}
                <DialogActions>
                    {
                        confirmOptions.cancelable !== false &&
                        <Button onClick={closeDialog(false)}>
                            {cancelText || 'Cancel'}
                        </Button>
                    }
                    <Button onClick={closeDialog(true)} color="primary" autoFocus>
                        {okText || 'Ok'}
                    </Button>
                </DialogActions>
            </>
        )
    }

    return (
        <SC.Provider value={context}>
            {children}
            <Dialog open={Boolean(confirmationSubject)}
                    onClose={closeDialog(false)}
                    maxWidth="sm">
                {dialogContent}
            </Dialog>
            {loading && <FrezzerLoader backdropClass={classes.backdrop}/>}
        </SC.Provider>
    );
}
