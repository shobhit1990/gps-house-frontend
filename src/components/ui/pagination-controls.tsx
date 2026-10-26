import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  /** When true, still render controls on a single page (prev/next disabled). */
  alwaysShow?: boolean;
}

export const PaginationControls = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  disabled = false,
  alwaysShow = false,
}: PaginationControlsProps) => {
  if (!alwaysShow && totalPages <= 1) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-muted-foreground">
        Page {safeCurrentPage} of {safeTotalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1 || disabled}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {/* Page Numbers */}
        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, safeTotalPages) }, (_, i) => {
            let pageNum;
            if (safeTotalPages <= 5) {
              pageNum = i + 1;
            } else if (safeCurrentPage <= 3) {
              pageNum = i + 1;
            } else if (safeCurrentPage >= safeTotalPages - 2) {
              pageNum = safeTotalPages - 4 + i;
            } else {
              pageNum = safeCurrentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={safeCurrentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                disabled={disabled}
                className="w-10"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage === safeTotalPages || disabled}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

