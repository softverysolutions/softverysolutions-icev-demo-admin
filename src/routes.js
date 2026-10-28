import Analytics from "layouts/analytics";
import SignInBasic from "layouts/authentication/sign-in/basic";
import AccommodationsList from "layouts/accommodation/accommodations-list";
import UsersList from "layouts/users/users-list";
import UserDetails from "layouts/users/user-details";
import ManagersList from "layouts/managers";
import ServicesList from "layouts/services/services-list";
import ServicePricing from "layouts/services/service-pricing";
import BulkAssignResult from "layouts/services/bulk-assign-result";
import SchoolsList from "layouts/schools/schools-list";
import ViewSchool from "layouts/schools/view-school";
import ViewCampus from "layouts/schools/view-campus";
import AddCoursePage from "layouts/courses/add-course-page";
import CoursesList from "layouts/courses/courses-list";
import OrdersList from "layouts/orders/orders-list";
import OrderDetailsPage from "layouts/orders/order-details";
import DestinationsList from "layouts/destinations/destinations-list";
import CountryFormPage from "layouts/destinations/country-form";
import CityFormPage from "layouts/destinations/city-form";
import DiscountsList from "layouts/discounts/discounts-list";
import PackagesList from "layouts/packages/packages-list";
import ExperiencesList from "layouts/experiences/experiences-list";
import AmenitiesList from "layouts/amenities/amenities-list";
import PromoCodesList from "layouts/promo-codes/promo-codes-list";
import PromoCodeFormPage from "layouts/promo-codes/promo-code-form";
import LearningJourneyList from "layouts/learning-journey/learning-journey-list";
import ReviewsList from "layouts/reviews/reviews-list";
import CommunityModeration from "layouts/community";

import ProtectedRoute from "components/ProtectedRoute";

import Shop from "examples/Icons/Shop";
import Office from "examples/Icons/Office";
import Basket from "examples/Icons/Basket";
import Document from "examples/Icons/Document";
import SpaceShip from "examples/Icons/SpaceShip";
import CustomerSupport from "examples/Icons/CustomerSupport";
import CreditCard from "examples/Icons/CreditCard";
import Cube from "examples/Icons/Cube";

const protect = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

const page = (name, key, route, element) => ({ name, key, route, component: protect(element) });

const routes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "home",
    icon: <SpaceShip size="12px" />,
    collapse: [page("Analytics", "analytics", "/home/analytics", <Analytics />)],
  },

  { type: "title", title: "Catalogue", key: "title-catalogue" },
  {
    type: "collapse",
    name: "Catalogue",
    key: "schools",
    icon: <Office size="12px" />,
    collapse: [
      page("Providers", "schools-list", "/schools/schools-list", <SchoolsList />),
      page("Programmes", "courses-list", "/schools/courses-list", <CoursesList />),
      page("Facilities", "amenities-list", "/schools/amenities-list", <AmenitiesList />),
      page(
        "Accommodation",
        "accommodations-list",
        "/accommodation/accommodations-list",
        <AccommodationsList />
      ),
      page("Extras", "services-list", "/services/services-list", <ServicesList />),
    ],
  },
  page("View Provider", "view-school", "/schools/view/:id", <ViewSchool />),
  page("View Location", "view-campus", "/schools/view/:schoolId/campus/:campusId", <ViewCampus />),
  page(
    "Add Programme",
    "add-course",
    "/schools/view/:schoolId/campus/:campusId/add-course/:courseId",
    <AddCoursePage />
  ),
  page("Extra Pricing", "service-pricing", "/services/:id/pricing", <ServicePricing />),
  page(
    "Bulk Assign Result",
    "bulk-assign-result",
    "/services/:serviceId/bulk-result",
    <BulkAssignResult />
  ),
  {
    type: "collapse",
    name: "Packages",
    key: "packages",
    icon: <Shop size="12px" />,
    collapse: [
      page("Packages", "packages-list", "/packages/packages-list", <PackagesList />),
      page("Experiences", "experiences-list", "/packages/experiences-list", <ExperiencesList />),
    ],
  },
  {
    type: "collapse",
    name: "Destinations",
    key: "destinations",
    icon: <Cube size="12px" />,
    collapse: [
      page("Countries & Cities", "destinations-list", "/orders/destinations", <DestinationsList />),
    ],
  },
  page(
    "New Country",
    "destinations-country-new",
    "/orders/destinations/country/new",
    <CountryFormPage />
  ),
  page(
    "Edit Country",
    "destinations-country-edit",
    "/orders/destinations/country/:id",
    <CountryFormPage />
  ),
  page("New City", "destinations-city-new", "/orders/destinations/city/new", <CityFormPage />),
  page("Edit City", "destinations-city-edit", "/orders/destinations/city/:id", <CityFormPage />),

  { type: "title", title: "Operations", key: "title-operations" },
  {
    type: "collapse",
    name: "Sales",
    key: "sales",
    icon: <CreditCard size="12px" />,
    collapse: [
      page("Orders", "orders-list", "/orders/orders-list", <OrdersList />),
      page("Discounts", "discounts-list", "/discounts/discounts-list", <DiscountsList />),
      page("Promo codes", "promo-codes-list", "/promo-codes", <PromoCodesList />),
    ],
  },
  page("View Order", "view-order", "/orders/view/:id", <OrderDetailsPage />),
  page("Create Promo Code", "promo-code-new", "/promo-codes/new", <PromoCodeFormPage />),
  page("Edit Promo Code", "promo-code-edit", "/promo-codes/edit/:id", <PromoCodeFormPage />),
  {
    type: "collapse",
    name: "Learning",
    key: "learning",
    icon: <Document size="12px" />,
    collapse: [
      page("Course plans", "course-plans", "/learning/course-plans", <LearningJourneyList />),
    ],
  },
  {
    type: "collapse",
    name: "Community",
    key: "community",
    icon: <Basket size="12px" />,
    collapse: [
      page("Reviews", "reviews-list", "/reviews", <ReviewsList />),
      page(
        "Community moderation",
        "community-moderation",
        "/community/moderation",
        <CommunityModeration />
      ),
    ],
  },
  {
    type: "collapse",
    name: "Team",
    key: "users",
    icon: <CustomerSupport size="12px" />,
    collapse: [
      page("Customers", "users-list", "/users/users-list", <UsersList />),
      page("Team and roles", "managers-list", "/users/managers-list", <ManagersList />),
    ],
  },
  page("View Customer", "view-user", "/users/view/:id", <UserDetails />),
  {
    name: "Sign In",
    key: "sign-in",
    route: "/authentication/sign-in/basic",
    component: <SignInBasic />,
  },
];

export default routes;
