import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Icon from "@mui/material/Icon";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { TravelService } from "services/travelService";
import { AccommodationService } from "services/accommodationService";
import { CourseService } from "services/courseService";
import { OptimizedDataService } from "services/optimizedDataService";
import { UserService } from "services/userService";
import { getCourseTypeDisplay } from "utils/courseTypeUtils";
import OrderHeader from "./components/OrderHeader";
import StudentInfo from "./components/StudentInfo";
import CourseInfo from "./components/CourseInfo";
import AccommodationsSection from "./components/AccommodationsSection";
import AdditionalServices from "./components/AdditionalServices";
import ExperiencesSection from "./components/ExperiencesSection";
import CancelOrderModal from "./components/CancelOrderModal";
import CancellationInfo from "./components/CancellationInfo";
import OrderPricingDetails from "./components/OrderPricingDetails";
import { buildCourseServiceOptions } from "./utils/buildCourseServiceOptions";
import {
  calculatePriceDifferenceAmount,
  getPriceDifferenceOldTotal,
} from "./utils/priceDifferenceUtils";
import PriceDifferenceBanner from "./components/EditOrderModal/components/PriceDifferenceBanner";
import AuditLogsSection from "./components/AuditLogsSection";

import TrackOrder from "./components/TrackOrder";
import PaymentStatus from "./components/PaymentStatus";
import { useCan } from "permissions/useCan";
import { F } from "permissions/features";
import { mapTravelExperiences } from "utils/travelExperienceUtils";

function isStudentPresentOnTravelPayload(travelData) {
  if (!travelData || typeof travelData !== "object") return false;
  if (Array.isArray(travelData.students) && travelData.students.length > 0) return true;
  return Boolean(travelData.student && typeof travelData.student === "object");
}

function resolveTravelStudents(travelData) {
  if (!travelData || typeof travelData !== "object") return [];

  const fromArray = Array.isArray(travelData.students)
    ? travelData.students.filter((s) => s && typeof s === "object")
    : [];
  if (fromArray.length > 0) {
    return fromArray.map((s) => ({ ...s, _travelStudentLinked: true }));
  }

  if (travelData.student && typeof travelData.student === "object") {
    return [{ ...travelData.student, _travelStudentLinked: true }];
  }

  const fullName = [travelData.userFirstName, travelData.userLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fullName || Number(travelData.studentsCount) > 0) {
    return [
      {
        fullName: fullName || "Student",
        nationality: travelData.studentNationality,
        residenceCountryCode: travelData.residenceCountryCode,
        _travelStudentLinked: false,
      },
    ];
  }

  return [];
}

async function enrichTravelStudents(travelData) {
  let students = resolveTravelStudents(travelData);
  if (isStudentPresentOnTravelPayload(travelData) || !travelData?.userId) {
    return students;
  }

  try {
    const user = await UserService.getUserById(travelData.userId);
    const profileStudent =
      user?.student ||
      (Array.isArray(user?.students) && user.students.length > 0 ? user.students[0] : null);
    if (profileStudent && typeof profileStudent === "object") {
      const base = students[0] || {};
      return [
        {
          fullName:
            profileStudent.fullName ||
            base.fullName ||
            [travelData.userFirstName, travelData.userLastName].filter(Boolean).join(" ").trim(),
          nationality: profileStudent.nationality || base.nationality,
          residenceCountryCode: profileStudent.residenceCountryCode || base.residenceCountryCode,
          birthDate: profileStudent.birthDate || profileStudent.dateOfBirth || base.birthDate,
          gender: profileStudent.gender || base.gender,
          phoneNumber: profileStudent.phoneNumber || base.phoneNumber,
          email: profileStudent.email || user?.email || base.email,
          skillLevel: profileStudent.skillLevel || base.skillLevel,
          emergencyContact: profileStudent.emergencyContact || base.emergencyContact,
          _travelStudentLinked: false,
        },
      ];
    }
  } catch {
    /* user profile optional */
  }

  return students;
}

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useCan();
  const ordersIndexPath = "/orders/orders-list";
  const canChangePriceDiffStatus = can(F.ORDERS_PRICE_DIFF_STATUS);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);
  const [priceDifference, setPriceDifference] = useState(0);
  const [differenceStatus, setDifferenceStatus] = useState("not_handled");
  const [priceSummary, setPriceSummary] = useState(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [saveSnackbar, setSaveSnackbar] = useState({ open: false, message: "", severity: "error" });
  const priceCalculationTimeoutRef = useRef(null);
  const editedOrderRef = useRef(null);

  const [courses, setCourses] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingAccommodations, setIsLoadingAccommodations] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [adminDisplayNames, setAdminDisplayNames] = useState({});
  const canMutateOrder = can(F.ORDERS_EDIT_CANCEL);

  const priceDifferenceStatusToApi = (v) => {
    const map = {
      not_handled: "notHandled",
      invoice_sent: "invoiceSent",
      paid: "paid",
      refunded: "refunded",
      not_applicable: "notApplicable",
    };
    return map[v] || v;
  };
  const priceDifferenceStatusFromApi = (v) => {
    const map = {
      notHandled: "not_handled",
      invoiceSent: "invoice_sent",
      paid: "paid",
      refunded: "refunded",
      notApplicable: "not_applicable",
    };
    return map[v] || v || "not_handled";
  };

  const fetchTravelDetails = async () => {
    try {
      setLoading(true);
      const travelData = await TravelService.getTravelById(id);
      const travelers = await enrichTravelStudents(travelData);
      let courseData = null;
      if (travelData.courseId) {
        try {
          courseData = await CourseService.getCourseById(travelData.courseId);
        } catch {
          courseData = null;
        }
      }

      let accommodationDetails = travelData.accommodationBooking?.accommodation || null;
      if (
        travelData.accommodationBooking &&
        (!accommodationDetails?.name || !accommodationDetails?.category) &&
        accommodationDetails?.id
      ) {
        try {
          accommodationDetails = await AccommodationService.getAccommodationById(
            accommodationDetails.id
          );
        } catch (accommodationError) {}
      }

      const tripDateBounds = {
        tripStartDate: travelData.selectedStartDate || travelData.start || null,
        tripEndDate: travelData.end || null,
      };

      const transformedOrder = {
        id: travelData.id,
        buyerName: travelData.userFirstName
          ? travelData.userLastName
            ? `${travelData.userFirstName} ${travelData.userLastName}`
            : travelData.userFirstName
          : travelers?.[0]?.fullName ||
            `User ${travelData.userId?.substring(0, 8)}...` ||
            "Unknown",
        orderDate: travelData.createdAt,
        updateDate: travelData.updatedAt,
        status: travelData.status
          ? typeof travelData.status === "string"
            ? travelData.status.toLowerCase()
            : travelData.status
          : travelData.status,
        travelers,
        tripStartDate: tripDateBounds.tripStartDate,
        tripEndDate: tripDateBounds.tripEndDate,
        course: (() => {
          const coursePrice = travelData.coursePrice || 0;
          const totalDiscountValue =
            travelData.totalDiscount ??
            travelData.summary?.discountAmount ??
            travelData.discount?.value ??
            null;
          const subtotalValue = travelData.subtotal ?? travelData.summary?.courseBase ?? null;
          const discountTitleValue =
            travelData.discountTitle ??
            travelData.summary?.discountTitle ??
            travelData.discount?.title ??
            travelData.discount?.name ??
            null;

          const hasRealDiscount =
            totalDiscountValue !== null &&
            totalDiscountValue !== undefined &&
            totalDiscountValue > 0;

          const totalDiscount = hasRealDiscount ? totalDiscountValue : null;
          const subtotal =
            subtotalValue !== null && subtotalValue !== undefined ? subtotalValue : coursePrice;
          const discountTitle = discountTitleValue;

          const courseTotalFromSummary = travelData.summary?.courseTotal;
          const finalCost = hasRealDiscount
            ? courseTotalFromSummary ?? subtotal - totalDiscount ?? coursePrice
            : coursePrice;

          return {
            name: courseData?.name || travelData.courseName?.split(" - ")?.[0] || "Programme",
            cost: finalCost,
            duration: `${travelData.duration} weeks`,
            selectedStartDate: tripDateBounds.tripStartDate,
            startDate: tripDateBounds.tripStartDate,
            endDate: tripDateBounds.tripEndDate,
            courseType: getCourseTypeDisplay(courseData) ?? courseData?.programType ?? null,
            campusId: courseData?.campusId || travelData.campusId,
            courseId: travelData.courseId,
            city: travelData.courseName?.split(" - ")?.[1] || "",
            country: travelData.courseName?.split(" - ")?.[2] || "",
            totalDiscount: totalDiscount,
            subtotal: subtotal,
            discountTitle: discountTitle,
            currency: travelData.currency || "EUR",
          };
        })(),
        accommodation: {
          id: accommodationDetails?.id || travelData.accommodationBooking?.accommodationId,
          accommodationId:
            accommodationDetails?.id || travelData.accommodationBooking?.accommodationId,
          name: accommodationDetails?.name || "No accommodation",
          image: accommodationDetails?.image || null,
          cost: travelData.accommodationBooking?.price || 0,
          category: accommodationDetails?.category,
          type: accommodationDetails?.type,
          bathroomType: accommodationDetails?.bathroomType,
          regimeType: accommodationDetails?.regimeType,
          address: accommodationDetails?.address,
          description: accommodationDetails?.description,
          url: accommodationDetails?.url,
          minAge: accommodationDetails?.minAge,
          maxAge: accommodationDetails?.maxAge,
          currency: accommodationDetails?.currency || travelData.currency || "EUR",
          startDate: travelData.accommodationBooking?.startDate,
          endDate: travelData.accommodationBooking?.endDate,
          duration:
            travelData.accommodationBooking?.startDate && travelData.accommodationBooking?.endDate
              ? `${Math.ceil(
                  (new Date(travelData.accommodationBooking.endDate) -
                    new Date(travelData.accommodationBooking.startDate)) /
                    (1000 * 60 * 60 * 24 * 7)
                )} weeks`
              : "",
        },
        additionalServices: (travelData.travelServices || [])
          .map((travelService) => {
            const serviceId =
              travelService.courseService?.service?.id ||
              travelService.serviceId ||
              travelService.service?.id ||
              travelService.id;
            const serviceName =
              travelService.courseService?.service?.name ||
              travelService.name ||
              `Travel Service ${travelService.isMandatory ? "(Mandatory)" : ""}`;
            const courseServiceId = travelService.courseService?.id;

            if (!serviceId) {
              return null;
            }

            return {
              name: serviceName,
              cost: travelService.price || 0,
              currency:
                travelService.courseService?.service?.currency || travelService.service?.currency,
              id: serviceId,
              courseServiceId,
              isMandatory: Boolean(travelService.courseService?.isMandatory),
              travelServiceId: travelService.id,
              createdAt: travelService.createdAt,
            };
          })
          .filter((service) => service !== null),
        experiences: mapTravelExperiences(travelData),
        courseFees: travelData.travelCourseFees || [],
        documents: travelers.flatMap((student) => student.documents || []) || [],
        timeline: [],
        payments: travelData.payments || [],
        totalAmount: travelData.totalPrice || 0,
        paidAmount:
          travelData.payments?.reduce((sum, payment) => {
            return payment.status === "success" ? sum + payment.amount : sum;
          }, 0) || 0,
        paidPercent: travelData.paidPercent || 0,
        documentStatus: travelData.documentStatus,
        refundStatus: travelData.refundStatus,
        cancellationReason: travelData.cancellationReason || travelData.cancelReason || null,
        downloadDocuments: travelData.courseDownloadDocuments || [],
        userId: travelData.userId,
        userFirstName: travelData.userFirstName,
        userLastName: travelData.userLastName,
        courseId: travelData.courseId,
        studentsCount: travelData.studentsCount,
        currency: travelData.currency || "EUR",
        priceDifferenceAmount: travelData.priceDifferenceAmount ?? null,
        priceDifferenceBaseTotal: travelData.priceDifferenceBaseTotal ?? null,
        priceDifferenceStatus: travelData.priceDifferenceStatus ?? null,
        auditLogs: travelData.auditLogs || [],
        isFixedPackage: Boolean(travelData.isFixedPackage),
        pricingDetails: {
          courseTotal: travelData.summary?.courseBase ?? travelData.coursePrice ?? null,
          accommodationTotal: travelData.summary?.accommodationTotal ?? null,
          extrasTotal: travelData.summary?.extrasTotal ?? null,
          discountAmount: travelData.summary?.discountAmount ?? null,
          discountTitle: travelData.summary?.discountTitle ?? null,
          promoCodeTitle: travelData.summary?.promoCodeTitle ?? null,
          promoCodeDiscountAmount: travelData.summary?.promoCodeDiscountAmount ?? null,
          promoCodeScope: travelData.summary?.promoCodeScope ?? null,
          total: travelData.totalPrice ?? null,
        },
        paymentMethod: travelData.paymentMethod || null,
        customerEmail: travelData.userEmail || null,
        packageName: travelData.packageName || null,
      };

      transformedOrder.remainingAmount = transformedOrder.totalAmount - transformedOrder.paidAmount;

      setOrder(transformedOrder);
      setDifferenceStatus(
        priceDifferenceStatusFromApi(transformedOrder.priceDifferenceStatus) || "not_handled"
      );

      try {
        if (transformedOrder.courseId) {
          const duration =
            travelData.duration || transformedOrder.course?.duration?.replace(" weeks", "") || 0;
          await loadServices(transformedOrder.courseId, duration);
        } else {
          await loadServices(null);
        }
      } catch (servicesError) {}
    } catch (error) {
      console.error("Error fetching travel details:", error);
      navigate(ordersIndexPath);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceDifferenceStatusChange = async (newStatus) => {
    if (!canChangePriceDiffStatus || !id || !order) return;
    const prevStatus = order.priceDifferenceStatus ?? differenceStatus;
    setDifferenceStatus(newStatus);
    try {
      const apiStatus = priceDifferenceStatusToApi(newStatus);
      await TravelService.updateTravel(id, { priceDifferenceStatus: apiStatus });
      await fetchTravelDetails();
    } catch (err) {
      console.error("Failed to update price difference status:", err);
      setDifferenceStatus(priceDifferenceStatusFromApi(prevStatus) || "not_handled");
    }
  };

  useEffect(() => {
    const logs = order?.auditLogs || [];
    const adminIds = [...new Set(logs.map((log) => log.adminId).filter(Boolean))];
    if (adminIds.length === 0) {
      setAdminDisplayNames({});
      return;
    }
    let cancelled = false;
    const map = {};
    Promise.all(
      adminIds.map(async (adminId) => {
        try {
          const user = await UserService.getUserById(adminId);
          const name =
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.fullName ||
            user.displayName ||
            user.email ||
            "";
          if (!cancelled) map[adminId] = name || adminId;
        } catch {
          if (!cancelled) map[adminId] = adminId;
        }
      })
    ).then(() => {
      if (!cancelled) setAdminDisplayNames(map);
    });
    return () => {
      cancelled = true;
    };
  }, [order?.auditLogs]);

  const calculatePriceForEditedOrder = useCallback(() => {
    if ((!editedOrder && !editedOrderRef.current) || !order || isCalculatingPrice) return;

    if (priceCalculationTimeoutRef.current) {
      clearTimeout(priceCalculationTimeoutRef.current);
    }

    priceCalculationTimeoutRef.current = setTimeout(async () => {
      const currentEdited = editedOrderRef.current ?? editedOrder;
      if (!currentEdited) {
        setIsCalculatingPrice(false);
        return;
      }
      setIsCalculatingPrice(true);
      try {
        const priceCalculationData = {};

        if (currentEdited.course?.courseId) {
          priceCalculationData.courseId = currentEdited.course.courseId;
        }
        if (currentEdited.course?.startDate) {
          try {
            const dateObj = new Date(currentEdited.course.startDate);
            if (!isNaN(dateObj.getTime())) {
              priceCalculationData.selectedStartDate = dateObj.toISOString();
            }
          } catch (e) {
            console.error("Error formatting start date:", e);
          }
        }
        if (currentEdited.course?.duration) {
          const duration =
            typeof currentEdited.course.duration === "string"
              ? parseInt(currentEdited.course.duration.replace(" weeks", ""))
              : currentEdited.course.duration;
          priceCalculationData.duration = duration;
        }

        if (currentEdited.accommodation?.accommodationId) {
          priceCalculationData.accommodationBooking = {
            accommodationId: currentEdited.accommodation.accommodationId,
          };
          if (currentEdited.accommodation.startDate) {
            try {
              const dateObj = new Date(currentEdited.accommodation.startDate);
              if (!isNaN(dateObj.getTime())) {
                priceCalculationData.accommodationBooking.startDate = dateObj.toISOString();
              }
            } catch (e) {}
          }
          if (currentEdited.accommodation.duration) {
            const duration =
              typeof currentEdited.accommodation.duration === "string"
                ? parseInt(currentEdited.accommodation.duration.replace(" weeks", ""))
                : currentEdited.accommodation.duration;
            priceCalculationData.accommodationBooking.duration = duration;
          }
        }

        if (currentEdited.course?.courseId && currentEdited.additionalServices?.length > 0) {
          try {
            const courseServices =
              (await CourseService.getCourseById(currentEdited.course.courseId))?.services || [];
            const validCourseServiceIds = new Set((courseServices || []).map((cs) => cs.id));
            const courseServiceIds = [];
            currentEdited.additionalServices.forEach((selectedService) => {
              if (selectedService.isMandatory) return;
              const idToUse =
                selectedService.courseServiceId ||
                courseServices.find((cs) => (cs.service?.id || cs.serviceId) === selectedService.id)
                  ?.id;
              if (idToUse && validCourseServiceIds.has(idToUse)) {
                courseServiceIds.push(idToUse);
              }
            });
            priceCalculationData.courseServiceIds = [...new Set(courseServiceIds)];
          } catch (error) {}
        } else if (currentEdited.course?.courseId) {
          priceCalculationData.courseServiceIds = [];
        }

        if (Object.keys(priceCalculationData).length > 0) {
          const priceCalculation = await TravelService.calculateTravelPrice(
            order.id,
            priceCalculationData
          );

          if (priceCalculation?.summary) {
            const newTotal = priceCalculation.summary.travelTotal || order.totalAmount;
            const calculatedDifference = calculatePriceDifferenceAmount(order, newTotal);

            setPriceDifference(calculatedDifference);
            setPriceSummary(priceCalculation.summary);

            setEditedOrder((prev) => {
              const updated = prev ? { ...prev, totalAmount: newTotal } : prev;
              if (updated) editedOrderRef.current = updated;
              return updated;
            });

            if (calculatedDifference !== 0 && !differenceStatus) {
              setDifferenceStatus("notHandled");
            }
          }
        }
      } catch (priceError) {
        if (
          priceError.invalidIds &&
          Array.isArray(priceError.invalidIds) &&
          priceError.invalidIds.length > 0
        ) {
          setEditedOrder((prev) => {
            if (!prev?.additionalServices?.length) return prev;
            const invalidSet = new Set(priceError.invalidIds);
            const filtered = prev.additionalServices.filter(
              (s) => !invalidSet.has(s.courseServiceId)
            );
            if (filtered.length === prev.additionalServices.length) return prev;
            const next = { ...prev, additionalServices: filtered };
            editedOrderRef.current = next;
            return next;
          });
        }
      } finally {
        setIsCalculatingPrice(false);
      }
    }, 500);
  }, [editedOrder, order, isCalculatingPrice, differenceStatus]);

  useEffect(() => {
    if (id) {
      fetchTravelDetails();
    } else {
      navigate(ordersIndexPath);
    }
  }, [id, navigate, ordersIndexPath]);

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox my={3}>
          <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <SoftBox>Loading...</SoftBox>
          </SoftBox>
        </SoftBox>
      </DashboardLayout>
    );
  }

  if (!order) {
    return null;
  }

  const showPriceDifference =
    isEditMode ||
    (order?.priceDifferenceAmount != null && Number(order.priceDifferenceAmount) !== 0);

  const handleBackToOrders = () => {
    navigate(ordersIndexPath);
  };

  const handleCancelClick = () => {
    if (!canMutateOrder) return;
    setCancelModalOpen(true);
  };

  const handleCancelOrder = async (cancelData) => {
    if (!canMutateOrder) return;
    try {
      await TravelService.cancelTravel(order.id, cancelData);
      await fetchTravelDetails();
      setCancelModalOpen(false);
    } catch (error) {
      console.error("Error cancelling order:", error);
      throw error;
    }
  };

  const loadCourses = async (campusId) => {
    if (!campusId) {
      setCourses([]);
      return;
    }
    setIsLoadingCourses(true);
    try {
      const coursesOptions = await OptimizedDataService.getCoursesForCampuses([campusId]);
      setCourses(coursesOptions);
    } catch (error) {
      console.error("Error loading courses:", error);
      setCourses([]);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadAccommodations = async (campusId) => {
    if (!campusId) {
      setAccommodations([]);
      return;
    }
    setIsLoadingAccommodations(true);
    try {
      const accommodationsData = await AccommodationService.getAllAccommodations({
        campusIds: [campusId],
      });
      const accommodationOptions = (accommodationsData.data || []).map((acc) => ({
        value: acc.id,
        label: `${acc.name} - ${acc.type || ""}`,
      }));
      setAccommodations(accommodationOptions);
    } catch (error) {
      console.error("Error loading accommodations:", error);
      setAccommodations([]);
    } finally {
      setIsLoadingAccommodations(false);
    }
  };

  const loadServices = async (courseId = null, duration = null) => {
    setIsLoadingServices(true);
    try {
      let serviceOptions = [];

      if (courseId) {
        try {
          const courseData = await CourseService.getCourseById(courseId);
          const courseDuration =
            duration || order?.course?.duration?.replace(" weeks", "") || order?.duration || 0;

          serviceOptions = buildCourseServiceOptions(courseData.services, courseDuration);
        } catch (error) {
          console.error("Error loading course services:", error);
          const { ServiceService } = await import("services/serviceService");
          const servicesData = await ServiceService.getAllServices();
          serviceOptions = (servicesData || [])
            .filter((service) => service.isActive !== false)
            .map((service) => ({
              value: service.id,
              label: service.name,
              price: 0,
              currency: service.currency,
            }));
        }
      } else {
        const { ServiceService } = await import("services/serviceService");
        const servicesData = await ServiceService.getAllServices();
        serviceOptions = (servicesData || [])
          .filter((service) => service.isActive !== false)
          .map((service) => ({
            value: service.id,
            label: service.name,
            price: 0,
            currency: service.currency,
          }));
      }

      setServices(serviceOptions);
    } catch (error) {
      console.error("Error loading services:", error);
      setServices([]);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleEditClick = async () => {
    if (!canMutateOrder) return;
    setIsEditMode(true);
    const orderCopy = JSON.parse(JSON.stringify(order));
    const initialEdited = {
      ...orderCopy,
      travelers: orderCopy.travelers ? [...orderCopy.travelers] : [],
      course: orderCopy.course ? { ...orderCopy.course } : null,
      accommodation: orderCopy.accommodation ? { ...orderCopy.accommodation } : null,
      additionalServices: orderCopy.additionalServices ? [...orderCopy.additionalServices] : [],
      documents: orderCopy.documents ? [...orderCopy.documents] : [],
      payments: orderCopy.payments ? [...orderCopy.payments] : [],
    };
    editedOrderRef.current = initialEdited;
    setEditedOrder(initialEdited);
    setPriceDifference(calculatePriceDifferenceAmount(order, order.totalAmount));
    setDifferenceStatus(
      priceDifferenceStatusFromApi(order.priceDifferenceStatus) || "not_handled"
    );

    const campusId = order?.course?.campusId;
    const courseId = order?.course?.courseId;

    if (campusId) {
      await Promise.all([loadCourses(campusId), loadAccommodations(campusId)]);
    }

    if (courseId) {
      const duration =
        orderCopy?.course?.duration?.replace(" weeks", "") ||
        order?.course?.duration?.replace(" weeks", "") ||
        order?.duration ||
        0;
      await loadServices(courseId, duration);
    } else {
      await loadServices(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedOrder(null);
    editedOrderRef.current = null;
    setPriceDifference(0);
    setDifferenceStatus("not_handled");
    setCourses([]);
    setAccommodations([]);
    setServices([]);
  };

  const mapGender = (gender) => {
    if (!gender) return "";
    const genderLower = gender.toLowerCase();
    const genderMap = {
      male: "Male",
      female: "Female",
      other: "Undisclosed",
      undisclosed: "Undisclosed",
    };
    if (["Male", "Female", "Undisclosed"].includes(gender)) {
      return gender;
    }
    return genderMap[genderLower] || gender;
  };

  const normalizeDateForCompare = (val) => {
    if (val == null || val === "") return "";
    try {
      const d = typeof val === "string" ? new Date(val) : val;
      return isNaN(d.getTime()) ? "" : d.toISOString();
    } catch {
      return String(val);
    }
  };

  const buildPatchPayload = (updateData, originalOrder) => {
    const patch = {};
    const orig = originalOrder || {};

    if (updateData.student && orig.travelers?.[0]) {
      const o = orig.travelers[0];
      const s = updateData.student;
      const studentPatch = {};
      const fullNameNew = s.fullName ?? o.fullName ?? "";
      if (fullNameNew !== (o.fullName ?? "")) studentPatch.fullName = fullNameNew;
      if ((s.nationality ?? "") !== (o.nationality ?? ""))
        studentPatch.nationality = s.nationality ?? "";
      if ((s.phoneNumber ?? "") !== (o.phoneNumber ?? ""))
        studentPatch.phoneNumber = s.phoneNumber ?? "";
      if ((s.skillLevel ?? "") !== (o.skillLevel ?? "")) studentPatch.skillLevel = s.skillLevel ?? "";
      if ((s.gender ?? "") !== (o.gender ?? "")) studentPatch.gender = s.gender ?? "";
      const birthNew = normalizeDateForCompare(s.birthDate);
      const birthOrig = normalizeDateForCompare(o.birthDate || o.dateOfBirth);
      if (birthNew !== birthOrig) studentPatch.birthDate = s.birthDate;
      const ec = s.emergencyContact;
      const ecOrig = o.emergencyContact;
      if (ec || ecOrig) {
        const ecFullName = (ec?.fullName ?? "") !== (ecOrig?.fullName ?? "");
        const ecPhone = (ec?.phoneNumber ?? "") !== (ecOrig?.phoneNumber ?? "");
        const ecRel = (ec?.relationship ?? "") !== (ecOrig?.relationship ?? "");
        if (ecFullName || ecPhone || ecRel) {
          studentPatch.emergencyContact = {
            fullName: ec?.fullName ?? "",
            phoneNumber: ec?.phoneNumber ?? "",
            relationship: ec?.relationship ?? "",
          };
        }
      }
      if (Object.keys(studentPatch).length > 0) patch.student = studentPatch;
    } else if (updateData.student && !orig.travelers?.[0]) {
      patch.student = updateData.student;
    }

    const origCourseId = orig.courseId ?? orig.course?.courseId;
    if (updateData.courseId !== undefined && updateData.courseId !== origCourseId) {
      patch.courseId = updateData.courseId;
    }

    const origStart = normalizeDateForCompare(
      orig.course?.selectedStartDate ?? orig.course?.startDate
    );
    if (updateData.selectedStartDate !== undefined) {
      const newStart = normalizeDateForCompare(updateData.selectedStartDate);
      if (newStart !== origStart) patch.selectedStartDate = updateData.selectedStartDate;
    }

    const origDuration = (() => {
      const d = orig.course?.duration ?? orig.duration;
      return typeof d === "string" ? parseInt(d.replace(" weeks", ""), 10) : d;
    })();
    if (updateData.duration !== undefined && updateData.duration !== origDuration) {
      patch.duration = updateData.duration;
    }

    const origAcc = orig.accommodation;
    if (updateData.accommodationBooking === null && origAcc?.accommodationId) {
      patch.accommodationBooking = null;
    } else if (
      updateData.accommodationBooking &&
      typeof updateData.accommodationBooking === "object"
    ) {
      const ab = updateData.accommodationBooking;
      const origAccId = origAcc?.accommodationId ?? origAcc?.id;
      const origAccStart = normalizeDateForCompare(origAcc?.startDate);
      const origAccDur =
        typeof origAcc?.duration === "string"
          ? parseInt(origAcc.duration.replace(" weeks", ""), 10)
          : origAcc?.duration ?? 0;
      const newAccStart = normalizeDateForCompare(ab.startDate);
      const newAccDur = parseInt(ab.duration, 10) || ab.duration;
      if (
        (ab.accommodationId ?? "") !== (origAccId ?? "") ||
        newAccStart !== origAccStart ||
        newAccDur !== origAccDur
      ) {
        patch.accommodationBooking = updateData.accommodationBooking;
      }
    }

    const origServiceIds = (orig.additionalServices ?? [])
      .map((x) => x.courseServiceId)
      .filter(Boolean)
      .sort();
    if (updateData.courseServiceIds !== undefined) {
      const newIds = [...(updateData.courseServiceIds || [])].sort();
      if (
        newIds.length !== origServiceIds.length ||
        newIds.some((id, i) => id !== origServiceIds[i])
      ) {
        patch.courseServiceIds = updateData.courseServiceIds;
      }
    }

    const origPriceStatus = orig.priceDifferenceStatus ?? "";
    if (
      updateData.priceDifferenceStatus !== undefined &&
      updateData.priceDifferenceStatus !== origPriceStatus
    ) {
      patch.priceDifferenceStatus = updateData.priceDifferenceStatus;
    }

    return patch;
  };

  const handleSaveOrder = async (changes) => {
    if (!canMutateOrder) return;
    try {
      const latestEditedOrder = changes ? null : editedOrderRef.current ?? editedOrder;
      const dataToSave =
        changes ||
        (latestEditedOrder
          ? {
              travelers: latestEditedOrder.travelers || [],
              students: latestEditedOrder.travelers || [],
              course: latestEditedOrder.course || null,
              accommodation: latestEditedOrder.accommodation || null,
              services: latestEditedOrder.additionalServices || [],
              documents: latestEditedOrder.documents || [],
            }
          : null);

      if (!dataToSave) {
        setIsEditMode(false);
        setEditedOrder(null);
        editedOrderRef.current = null;
        setPriceDifference(0);
        setDifferenceStatus("not_handled");
        return;
      }

      const updateData = {};

      let student = null;
      const originalStudent = order?.travelers?.[0];

      if (isEditMode) {
        const editedStudent = dataToSave?.travelers?.[0] ?? editedOrder?.travelers?.[0];
        if (editedStudent) {
          student = {
            ...originalStudent,
            ...editedStudent,
          };
        } else if (originalStudent) {
          student = originalStudent;
        }
      } else if (dataToSave?.travelers && dataToSave.travelers.length > 0) {
        student = dataToSave.travelers[0];
      } else if (dataToSave?.students && dataToSave.students.length > 0) {
        student = dataToSave.students[0];
      } else if (originalStudent) {
        student = originalStudent;
      }

      if (student || (isEditMode && originalStudent)) {
        const studentToUse = student || originalStudent;

        let emergencyContact = null;
        if (studentToUse.emergencyContact) {
          if (typeof studentToUse.emergencyContact === "string") {
            const match = studentToUse.emergencyContact.match(
              /^(.+?)(?:\s*-\s*(.+?))?(?:\s*\((.+?)\))?$/
            );
            if (match) {
              emergencyContact = {
                fullName: match[1].trim(),
                phoneNumber: match[2]?.trim() || "",
                relationship: match[3]?.trim() || "",
              };
            } else {
              emergencyContact = {
                fullName: studentToUse.emergencyContact,
                phoneNumber: "",
                relationship: "",
              };
            }
          } else if (typeof studentToUse.emergencyContact === "object") {
            emergencyContact = {
              fullName: studentToUse.emergencyContact.fullName || "",
              phoneNumber: studentToUse.emergencyContact.phoneNumber || "",
              relationship: studentToUse.emergencyContact.relationship || "",
            };
          }
        }

        let formattedBirthDate = studentToUse.birthDate || studentToUse.dateOfBirth || "";
        if (
          formattedBirthDate &&
          typeof formattedBirthDate === "string" &&
          !formattedBirthDate.includes("T")
        ) {
          try {
            const date = new Date(formattedBirthDate);
            if (!isNaN(date.getTime())) {
              formattedBirthDate = date.toISOString();
            }
          } catch (e) {}
        }

        const gender = studentToUse.gender || "";

        updateData.student = {
          fullName:
            studentToUse.fullName ||
            order.travelers?.[0]?.fullName ||
            (order.userFirstName && order.userLastName
              ? `${order.userFirstName} ${order.userLastName}`
              : order.userFirstName) ||
            "",
          nationality: studentToUse.nationality || order.travelers?.[0]?.nationality || "",
          phoneNumber: studentToUse.phoneNumber || studentToUse.phone || "",
          skillLevel: studentToUse.skillLevel || "",
          gender: mapGender(gender),
          birthDate: formattedBirthDate,
          emergencyContact: emergencyContact,
        };
      }

      const courseData = dataToSave?.course || (isEditMode && editedOrder?.course) || null;
      const originalCourseId = order?.courseId || order?.course?.courseId;
      const newCourseId = courseData?.courseId;
      const courseChanged = newCourseId && newCourseId !== originalCourseId;

      if (courseData) {
        if (courseData.courseId) {
          updateData.courseId = courseData.courseId;
        }
        let startDate = courseData.startDate || courseData.selectedStartDate;
        if (startDate) {
          try {
            let dateObj;
            if (typeof startDate === "string") {
              if (startDate.includes("T")) {
                dateObj = new Date(startDate);
              } else if (startDate.includes("-")) {
                const parts = startDate.split("-");
                if (parts[0].length === 4) {
                  dateObj = new Date(startDate + "T00:00:00.000Z");
                } else {
                  dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00.000Z`);
                }
              } else {
                dateObj = new Date(startDate);
              }
            } else {
              dateObj = new Date(startDate);
            }

            if (!isNaN(dateObj.getTime())) {
              updateData.selectedStartDate = dateObj.toISOString();
            } else {
              updateData.selectedStartDate = startDate;
            }
          } catch (e) {
            updateData.selectedStartDate = startDate;
          }
        }
        if (courseData.duration) {
          const duration =
            typeof courseData.duration === "string"
              ? parseInt(courseData.duration.replace(" weeks", ""))
              : courseData.duration;
          updateData.duration = duration;
        }
      } else if (isEditMode && order?.course) {
        const originalCourseId = order?.courseId || order?.course?.courseId;
        const newCourseId = updateData.courseId;
        const courseChangedInElse = newCourseId && newCourseId !== originalCourseId;

        if (order.course.courseId) {
          updateData.courseId = order.course.courseId;
        }
        if (!courseChangedInElse && (order.course.startDate || order.course.selectedStartDate)) {
          let startDate = order.course.startDate || order.course.selectedStartDate;
          try {
            let dateObj;
            if (typeof startDate === "string") {
              if (startDate.includes("T")) {
                dateObj = new Date(startDate);
              } else if (startDate.includes("-")) {
                const parts = startDate.split("-");
                if (parts[0].length === 4) {
                  dateObj = new Date(startDate + "T00:00:00.000Z");
                } else {
                  dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00.000Z`);
                }
              } else {
                dateObj = new Date(startDate);
              }
            } else {
              dateObj = new Date(startDate);
            }

            if (!isNaN(dateObj.getTime())) {
              updateData.selectedStartDate = dateObj.toISOString();
            } else {
              updateData.selectedStartDate = startDate;
            }
          } catch (e) {
            console.error("Error formatting start date:", e);
            updateData.selectedStartDate = startDate;
          }
        }
        if (order.course.duration) {
          const duration =
            typeof order.course.duration === "string"
              ? parseInt(order.course.duration.replace(" weeks", ""))
              : order.course.duration;
          updateData.duration = duration;
        }
      }

      const accommodationData =
        dataToSave?.accommodation || (isEditMode && editedOrder?.accommodation) || null;
      if (accommodationData && accommodationData.accommodationId) {
        const duration =
          typeof accommodationData.duration === "string"
            ? parseInt(accommodationData.duration.replace(" weeks", ""))
            : accommodationData.duration;

        let startDate = accommodationData.startDate || "";
        if (startDate) {
          try {
            let dateObj;
            if (typeof startDate === "string") {
              if (startDate.includes("T")) {
                dateObj = new Date(startDate);
              } else if (startDate.includes("-")) {
                const parts = startDate.split("-");
                if (parts[0].length === 4) {
                  dateObj = new Date(startDate + "T00:00:00.000Z");
                } else {
                  dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00.000Z`);
                }
              } else {
                dateObj = new Date(startDate);
              }
            } else {
              dateObj = new Date(startDate);
            }

            if (!isNaN(dateObj.getTime())) {
              startDate = dateObj.toISOString();
            }
          } catch (e) {}
        }

        updateData.accommodationBooking = {
          accommodationId: accommodationData.accommodationId,
          startDate: startDate,
          duration: duration || 0,
        };
      } else if (
        (isEditMode &&
          (editedOrder?.accommodation === null || !accommodationData?.accommodationId)) ||
        accommodationData === null
      ) {
        updateData.accommodationBooking = null;
      } else if (isEditMode && order?.accommodation && order.accommodation.accommodationId) {
        const duration =
          typeof order.accommodation.duration === "string"
            ? parseInt(order.accommodation.duration.replace(" weeks", ""))
            : order.accommodation.duration;

        updateData.accommodationBooking = {
          accommodationId: order.accommodation.accommodationId,
          startDate: order.accommodation.startDate || "",
          duration: duration || 0,
        };
      }

      const courseId = updateData.courseId || order.courseId;
      const selectedServicesRaw =
        dataToSave?.services ??
        latestEditedOrder?.additionalServices ??
        editedOrder?.additionalServices ??
        order?.additionalServices ??
        [];
      const orderHasServices =
        Array.isArray(order?.additionalServices) && order.additionalServices.length > 0;
      const selectedServices =
        (Array.isArray(selectedServicesRaw) && selectedServicesRaw.length > 0) || !orderHasServices
          ? selectedServicesRaw
          : order?.additionalServices ?? [];
      const hasServicesArray = Array.isArray(selectedServices);

      if (courseId && !courseChanged) {
        try {
          const courseServices = (await CourseService.getCourseById(courseId))?.services || [];
          const validCourseServiceIds = new Set((courseServices || []).map((cs) => cs.id));
          const courseServiceIds = [];

          (hasServicesArray ? selectedServices : []).forEach((selectedService) => {
            if (selectedService?.isMandatory) return;
            const idToUse =
              selectedService.courseServiceId ||
              courseServices.find(
                (cs) =>
                  (cs.service?.id || cs.serviceId) ===
                  (selectedService.id || selectedService.serviceId)
              )?.id;
            if (idToUse && validCourseServiceIds.has(idToUse)) {
              courseServiceIds.push(idToUse);
            }
          });
          updateData.courseServiceIds = [...new Set(courseServiceIds)];
        } catch (error) {}
      } else if (courseChanged) {
        updateData.courseServiceIds = [];
      }

      try {
        const priceCalculationData = {
          courseId: updateData.courseId,
          duration: updateData.duration,
          accommodationBooking: updateData.accommodationBooking,
        };

        if (updateData.selectedStartDate) {
          priceCalculationData.selectedStartDate = updateData.selectedStartDate;
        }

        if (courseChanged) {
          priceCalculationData.courseServiceIds = [];
        } else if (updateData.courseServiceIds) {
          priceCalculationData.courseServiceIds = updateData.courseServiceIds;
        }

        const priceCalculation = await TravelService.calculateTravelPrice(
          order.id,
          priceCalculationData
        );

        if (priceCalculation?.summary) {
          const newTotal = priceCalculation.summary.travelTotal || order.totalAmount;
          const calculatedDifference = calculatePriceDifferenceAmount(order, newTotal);
          setPriceDifference(calculatedDifference);

          if (editedOrder) {
            setEditedOrder((prev) => ({
              ...prev,
              totalAmount: newTotal,
            }));
          }

          if (calculatedDifference !== 0 && !differenceStatus) {
            setDifferenceStatus("notHandled");
          }
        }
      } catch (priceError) {}

      const patchPayload = buildPatchPayload(updateData, order);
      if (Object.keys(patchPayload).length > 0) {
        await TravelService.updateTravel(order.id, patchPayload);
      }
      await fetchTravelDetails();

      setIsEditMode(false);
      setEditedOrder(null);
      editedOrderRef.current = null;
      setPriceDifference(0);
      setDifferenceStatus("not_handled");
      setSaveSnackbar({ open: true, message: "Order saved successfully.", severity: "success" });
    } catch (error) {
      const message = error?.message || "Failed to save order";
      setSaveSnackbar({ open: true, message, severity: "error" });
    }
  };

  const calculatePriceDifference = (editedOrderData) =>
    calculatePriceDifferenceAmount(order, editedOrderData?.totalAmount);

  const handleOrderChange = (section, field, value) => {
    setEditedOrder((prev) => {
      if (!prev) return prev;
      let updatedOrder = prev;

      if (section === "students") {
        const [index, studentField, studentValue] = field;
        updatedOrder = {
          ...prev,
          travelers: prev.travelers.map((student, i) =>
            i === index ? { ...student, [studentField]: studentValue } : student
          ),
        };
      } else if (section === "course") {
        if (field === "courseId") {
          const selectedCourse = courses.find((c) => c.value === value);
          const previousCourseId = prev.course?.courseId;
          const courseChanged = value !== previousCourseId;

          updatedOrder = {
            ...prev,
            course: {
              ...prev.course,
              courseId: value,
              name: selectedCourse?.label || prev.course?.name,
              ...(courseChanged
                ? {
                    startDate: null,
                    selectedStartDate: null,
                    additionalServices: [],
                  }
                : {}),
            },
            ...(courseChanged ? { additionalServices: [] } : {}),
          };
          if (value) {
            const duration =
              editedOrder?.course?.duration?.replace(" weeks", "") ||
              order?.course?.duration?.replace(" weeks", "") ||
              order?.duration ||
              0;
            loadServices(value, duration);
          }
        } else {
          updatedOrder = {
            ...prev,
            course: {
              ...prev.course,
              [field]: value,
            },
          };
        }
      } else if (section === "accommodation") {
        if (field === "accommodationId") {
          if (value == null) {
            updatedOrder = { ...prev, accommodation: null };
          } else {
            const selectedAccommodation = accommodations.find((a) => a.value === value);
            updatedOrder = {
              ...prev,
              accommodation: {
                ...prev.accommodation,
                accommodationId: value,
                name: selectedAccommodation?.label?.split(" - ")[0] || prev.accommodation?.name,
              },
            };
          }
        } else {
          updatedOrder = {
            ...prev,
            accommodation: {
              ...prev.accommodation,
              [field]: value,
            },
          };
        }
      } else if (section === "services") {
        updatedOrder = {
          ...prev,
          additionalServices: value,
        };
      }

      editedOrderRef.current = updatedOrder;
      const diff = calculatePriceDifference(updatedOrder);
      setPriceDifference(diff);

      return updatedOrder;
    });

    if (
      isEditMode &&
      editedOrder &&
      (section === "course" || section === "accommodation" || section === "services")
    ) {
      calculatePriceForEditedOrder();
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={7}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} lg={12}>
            <Card>
              <SoftBox pt={2} px={2}>
                <OrderHeader
                  order={isEditMode ? editedOrder : order}
                  onBackClick={handleBackToOrders}
                  onCancelClick={handleCancelClick}
                  onEditClick={handleEditClick}
                  onCancelEdit={handleCancelEdit}
                  onSave={handleSaveOrder}
                  canMutateOrder={canMutateOrder}
                  isEditMode={isEditMode}
                />
              </SoftBox>
              <Divider />
              <SoftBox pt={1} pb={3} px={2}>
                {(order.status === "cancelled" ||
                  order.status === "canceled" ||
                  order.status === "Cancelled" ||
                  order.status === "Canceled" ||
                  order.status?.toLowerCase() === "cancelled" ||
                  order.status?.toLowerCase() === "canceled" ||
                  order.cancellationReason ||
                  order.refundStatus) && (
                  <SoftBox mb={3}>
                    <CancellationInfo
                      cancellationReason={order.cancellationReason}
                      refundStatus={order.refundStatus}
                      orderId={order.id}
                      onUpdate={fetchTravelDetails}
                    />
                  </SoftBox>
                )}
                {showPriceDifference && (
                  <>
                    {isEditMode && (
                      <SoftBox
                        mb={3}
                        p={2}
                        sx={{
                          backgroundColor: "#F1EDFF",
                          borderRadius: "8px",
                          border: "1px solid #90caf9",
                        }}
                      >
                        <SoftBox display="flex" alignItems="center" gap={1}>
                          <Icon sx={{ color: "#6D4AFF" }}>info</Icon>
                          <SoftTypography variant="body2" color="info">
                            All edits are logged in the activity log (who, when, what changed). The
                            price is recalculated from the catalogue; settle any difference with the
                            customer and track its status here.
                          </SoftTypography>
                        </SoftBox>
                      </SoftBox>
                    )}
                    <SoftBox mb={3}>
                      <PriceDifferenceBanner
                        priceDifference={
                          isEditMode
                            ? priceDifference
                            : order?.priceDifferenceAmount ??
                              calculatePriceDifferenceAmount(order, order?.totalAmount)
                        }
                        differenceStatus={
                          isEditMode
                            ? differenceStatus
                            : priceDifferenceStatusFromApi(order?.priceDifferenceStatus) ||
                              "not_handled"
                        }
                        onStatusChange={handlePriceDifferenceStatusChange}
                        statusReadOnly={!canChangePriceDiffStatus}
                        oldTotal={getPriceDifferenceOldTotal(order)}
                        newTotal={
                          isEditMode
                            ? editedOrder?.totalAmount ?? order?.totalAmount ?? 0
                            : order?.totalAmount ?? 0
                        }
                        currency={order?.currency || "EUR"}
                        priceSummary={isEditMode ? priceSummary : null}
                        isCalculating={isCalculatingPrice}
                      />
                    </SoftBox>
                  </>
                )}
                <SoftBox mb={3}>
                  <OrderPricingDetails
                    pricingDetails={order.pricingDetails}
                    currency={order.currency}
                  />
                </SoftBox>
                <SoftBox mb={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <StudentInfo
                        travelers={isEditMode ? editedOrder?.travelers : order.travelers}
                        userId={order.userId}
                        userFirstName={order.userFirstName}
                        userLastName={order.userLastName}
                        isEditMode={isEditMode}
                        onStudentChange={(index, field, value) =>
                          handleOrderChange("students", [index, field, value], null)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <CourseInfo
                        course={isEditMode ? editedOrder?.course : order.course}
                        isEditMode={isEditMode}
                        courses={courses}
                        isLoadingCourses={isLoadingCourses}
                        onCourseChange={(field, value) => handleOrderChange("course", field, value)}
                      />
                    </Grid>
                  </Grid>
                </SoftBox>
                <Divider />
                <SoftBox mt={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <AccommodationsSection
                        accommodation={
                          isEditMode ? editedOrder?.accommodation : order.accommodation
                        }
                        accommodations={accommodations}
                        isLoadingAccommodations={isLoadingAccommodations}
                        isEditMode={isEditMode}
                        onAccommodationChange={(field, value) =>
                          handleOrderChange("accommodation", field, value)
                        }
                        onAddAccommodation={() => {
                          if (accommodations.length > 0) {
                            handleOrderChange(
                              "accommodation",
                              "accommodationId",
                              accommodations[0].value
                            );
                          }
                        }}
                        courseStartDate={
                          (isEditMode ? editedOrder?.course : order.course)?.startDate
                        }
                        courseDurationWeeks={(() => {
                          const c = isEditMode ? editedOrder?.course : order.course;
                          if (!c?.duration) return null;
                          const d =
                            typeof c.duration === "string"
                              ? c.duration.replace(" weeks", "").trim()
                              : c.duration;
                          const num = parseInt(d, 10);
                          return Number.isNaN(num) ? null : num;
                        })()}
                        currency={order?.currency || "EUR"}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TrackOrder order={isEditMode ? editedOrder : order} />
                    </Grid>
                  </Grid>
                </SoftBox>
                <Divider sx={{ my: 3 }} />
                <SoftBox mt={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <AdditionalServices
                        services={
                          isEditMode ? editedOrder?.additionalServices : order.additionalServices
                        }
                        isEditMode={isEditMode}
                        servicesOptions={services}
                        isLoadingServices={isLoadingServices}
                        onServicesChange={(services) =>
                          handleOrderChange("services", null, services)
                        }
                        currency={order?.currency || "EUR"}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <PaymentStatus payments={order.payments} order={order} />
                    </Grid>
                  </Grid>
                </SoftBox>
                {(order.experiences || []).length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <ExperiencesSection experiences={order.experiences} />
                  </>
                )}
                <SoftBox mt={3}>
                  <AuditLogsSection
                    auditLogs={order.auditLogs || []}
                    adminDisplayNames={adminDisplayNames}
                  />
                </SoftBox>
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>

      <CancelOrderModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelOrder}
        orderId={order.id}
      />

      <Snackbar
        open={saveSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setSaveSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSaveSnackbar((s) => ({ ...s, open: false }))}
          severity={saveSnackbar.severity}
          variant="filled"
        >
          {saveSnackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

export default OrderDetails;
