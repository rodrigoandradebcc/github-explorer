const React = require('react');
const { View, Text, Image, ScrollView } = require('react-native');

const id = (x) => x;

const useSharedValue = (init) => ({ value: init });
const useAnimatedStyle = (fn) => fn();
const useReducedMotion = () => false;
const withTiming = (toValue) => toValue;
const withSpring = (toValue) => toValue;
const withDelay = (_delay, animation) => animation;
const withSequence = (...animations) => animations[animations.length - 1];
const withRepeat = (animation) => animation;
const runOnJS = (fn) => fn;
const runOnUI = (fn) => fn;

const makeEnteringConfig = () => {
  const cfg = {
    duration: () => cfg,
    delay: () => cfg,
    easing: () => cfg,
    springify: () => cfg,
    damping: () => cfg,
    stiffness: () => cfg,
  };
  return cfg;
};

const FadeIn = makeEnteringConfig();
const FadeInDown = makeEnteringConfig();
const FadeInUp = makeEnteringConfig();
const FadeOut = makeEnteringConfig();
const FadeOutUp = makeEnteringConfig();
const FadeOutDown = makeEnteringConfig();
const SlideInRight = makeEnteringConfig();
const SlideOutLeft = makeEnteringConfig();
const ZoomIn = makeEnteringConfig();
const ZoomOut = makeEnteringConfig();

const Easing = {
  out: id,
  in: id,
  inOut: id,
  cubic: id,
  linear: id,
  ease: id,
};

const AnimatedView = React.forwardRef(function AnimatedView(props, ref) {
  return React.createElement(View, { ...props, ref });
});
const AnimatedText = React.forwardRef(function AnimatedText(props, ref) {
  return React.createElement(Text, { ...props, ref });
});
const AnimatedImage = React.forwardRef(function AnimatedImage(props, ref) {
  return React.createElement(Image, { ...props, ref });
});
const AnimatedScrollView = React.forwardRef(function AnimatedScrollView(props, ref) {
  return React.createElement(ScrollView, { ...props, ref });
});

const Animated = {
  View: AnimatedView,
  Text: AnimatedText,
  Image: AnimatedImage,
  ScrollView: AnimatedScrollView,
  createAnimatedComponent: (Component) =>
    React.forwardRef(function AnimatedComponent(props, ref) {
      return React.createElement(Component, { ...props, ref });
    }),
};

module.exports = {
  __esModule: true,
  default: Animated,
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  runOnUI,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutUp,
  FadeOutDown,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  ZoomOut,
  Easing,
  ...Animated,
};
