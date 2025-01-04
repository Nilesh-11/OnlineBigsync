import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function AlertDialog(props) {
    const [err_message,setErr_message] = props.props;
    const [open, setOpen] = React.useState(true);

    //   const handleClickOpen = () => {
    //     setOpen(true);
    //   };

    const handleClose = () => {
        setOpen(false);
        setErr_message(null);
    };

    return (
        <div>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Sorry! We encountered some error"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {err_message?err_message:'There has been some problem'}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} autoFocus>
                        Go back
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
