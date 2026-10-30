import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SessionRevokeReason } from "@/enums/SessionRevokeReason";
import { useDispatch, useSelector } from "@/store/hooks";
import { selectPendingSessionRevoke } from "@/store/slices/authSlice";
import {
  forceLogout,
  getForcedLogoutMessage,
  getForcedLogoutTitle,
} from "@/utils/forceLogout";

/** Blocking popup that explains why the session ended; OK click completes logout. */
export function SessionRevokedDialog() {
  const dispatch = useDispatch();
  const reason = useSelector(selectPendingSessionRevoke);
  const open = Boolean(reason);
  const title = getForcedLogoutTitle(reason);
  const message =
    getForcedLogoutMessage(reason) ??
    "You will be logged out. Click OK to continue.";

  const confirmLogout = () => {
    forceLogout(dispatch, { reason: reason ?? SessionRevokeReason.SESSION_EXPIRED });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && open) {
          confirmLogout();
        }
      }}
    >
      <DialogContent
        className="z-[80]"
        onPointerDownOutside={(event) => {
          event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={confirmLogout}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
