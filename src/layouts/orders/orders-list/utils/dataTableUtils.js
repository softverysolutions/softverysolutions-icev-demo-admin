import {
  DateCell,
  DurationCell,
  AmountCell,
  ActionsCell,
  CourseCell,
  TravelStatusCell,
  PaymentStatusCell,
} from "./components";
import { COLUMN_WIDTHS } from "./constants";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDuration = (duration) => {
  if (!duration) return "N/A";
  return `${duration} ${Number(duration) === 1 ? "week" : "weeks"}`;
};

const getBuyerName = (travel) => {
  if (travel.userFirstName) {
    return travel.userLastName
      ? `${travel.userFirstName} ${travel.userLastName}`
      : travel.userFirstName;
  }
  return "Unknown customer";
};

const getCourseName = (travel) => {
  if (travel.packageName) return travel.packageName;
  const [name, city] = String(travel.courseName || "Programme").split(" - ");
  return city ? `${name} · ${city}` : name;
};

export const transformTravelToTableRow = (travel) => ({
  id: travel.id,
  buyerName: getBuyerName(travel),
  orderDate: formatDate(travel.createdAt),
  startDate: formatDate(travel.selectedStartDate),
  courseBought: getCourseName(travel),
  courseDuration: formatDuration(travel.duration),
  orderAmount: {
    amount: travel.totalPrice || 0,
    currency: travel.currency || "EUR",
  },
  status: travel.status,
  paymentStatus: travel.currentPaymentStatus,
  userId: travel.userId,
  courseId: travel.courseId,
});

export const buildDataTableData = (travels, handleViewOrder) => {
  const transformedRows = travels.map((travel) => {
    const row = transformTravelToTableRow(travel);
    return {
      ...row,
      actions: {
        row,
        onView: handleViewOrder,
      },
    };
  });

  return {
    columns: [
      {
        Header: "Customer",
        accessor: "buyerName",
        width: COLUMN_WIDTHS.BUYER_NAME,
        align: "left",
        Cell: ({ value }) => value,
      },
      {
        Header: "Ordered",
        accessor: "orderDate",
        width: COLUMN_WIDTHS.ORDER_DATE,
        align: "center",
        Cell: DateCell,
      },
      {
        Header: "Programme / package",
        accessor: "courseBought",
        width: COLUMN_WIDTHS.COURSE,
        align: "left",
        Cell: CourseCell,
      },
      {
        Header: "Starts",
        accessor: "startDate",
        width: COLUMN_WIDTHS.UPDATE_DATE,
        align: "center",
        Cell: DateCell,
      },
      {
        Header: "Duration",
        accessor: "courseDuration",
        width: COLUMN_WIDTHS.DURATION,
        align: "center",
        Cell: DurationCell,
      },
      {
        Header: "Status",
        accessor: "status",
        width: COLUMN_WIDTHS.STUDENTS,
        align: "center",
        Cell: TravelStatusCell,
      },
      {
        Header: "Payment",
        accessor: "paymentStatus",
        width: COLUMN_WIDTHS.PAYMENT_METHOD,
        align: "center",
        Cell: PaymentStatusCell,
      },
      {
        Header: "Amount",
        accessor: "orderAmount",
        width: COLUMN_WIDTHS.AMOUNT,
        align: "right",
        Cell: AmountCell,
      },
      {
        Header: "Actions",
        accessor: "actions",
        width: COLUMN_WIDTHS.ACTIONS,
        align: "center",
        Cell: ActionsCell,
      },
    ],
    rows: transformedRows,
  };
};
