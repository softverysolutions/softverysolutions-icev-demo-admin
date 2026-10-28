/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.3
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useEffect, useRef } from "react";

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// Dropzone components
import Dropzone from "dropzone";

// Dropzone styles
import "dropzone/dist/dropzone.css";

// Soft UI Dashboard PRO React components
import SoftBox from "components/SoftBox";

// Custom styles for the SoftDropzone
import SoftDropzoneRoot from "components/SoftDropzone/SoftDropzoneRoot";

const DROPZONE_EVENTS = [
  "addedfile",
  "removedfile",
  "error",
  "success",
  "complete",
  "canceled",
  "sending",
  "processing",
  "uploadprogress",
  "totaluploadprogress",
  "queuecomplete",
];

const DROPZONE_CALLBACK_KEYS = new Set([...DROPZONE_EVENTS, "accept", "init"]);

function buildDropzoneConfig(options) {
  const config = { ...options };
  DROPZONE_CALLBACK_KEYS.forEach((key) => {
    delete config[key];
  });
  return config;
}

function SoftDropzone({ options }) {
  const dropzoneRef = useRef(null);
  const dropzoneInstanceRef = useRef(null);
  const optionsRef = useRef(options);
  const destroyingRef = useRef(false);

  optionsRef.current = options;

  useEffect(() => {
    Dropzone.autoDiscover = false;

    const element = dropzoneRef.current;
    if (!element) return undefined;

    destroyingRef.current = false;

    const instance = new Dropzone(element, {
      autoProcessQueue: false,
      url: "#",
      ...buildDropzoneConfig(optionsRef.current),
      accept: (file, done) => {
        const acceptFn = optionsRef.current.accept;
        if (acceptFn) return acceptFn(file, done);
        return done();
      },
    });

    DROPZONE_EVENTS.forEach((eventName) => {
      instance.on(eventName, (...args) => {
        if (eventName === "error" && destroyingRef.current) return;
        optionsRef.current[eventName]?.(...args);
      });
    });

    optionsRef.current.init?.call(instance);

    dropzoneInstanceRef.current = instance;

    return () => {
      destroyingRef.current = true;
      instance.destroy();
      dropzoneInstanceRef.current = null;
    };
  }, []);

  return (
    <SoftDropzoneRoot
      component="form"
      action="/file-upload"
      ref={dropzoneRef}
      className="form-control dropzone"
    >
      <SoftBox className="fallback">
        <SoftBox component="input" name="file" type="file" multiple />
      </SoftBox>
    </SoftDropzoneRoot>
  );
}

// Typechecking props for the SoftDropzone
SoftDropzone.propTypes = {
  options: PropTypes.objectOf(PropTypes.any).isRequired,
};

export default SoftDropzone;
