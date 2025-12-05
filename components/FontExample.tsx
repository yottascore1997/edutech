import { useFonts } from '@/hooks/useFonts';
import { StyleSheet, Text, View } from 'react-native';

// Example component showing how to use the global font system
const FontExample = () => {
  const fonts = useFonts();

  return (
    <View style={styles.container}>
      {/* Headers */}
      <Text style={fonts.headerLarge}>Large Header</Text>
      <Text style={fonts.headerMedium}>Medium Header</Text>
      <Text style={fonts.headerSmall}>Small Header</Text>
      
      {/* Subheaders */}
      <Text style={fonts.subheaderLarge}>Large Subheader</Text>
      <Text style={fonts.subheaderMedium}>Medium Subheader</Text>
      <Text style={fonts.subheaderSmall}>Small Subheader</Text>
      
      {/* Body Text */}
      <Text style={fonts.bodyLarge}>Large Body Text</Text>
      <Text style={fonts.bodyMedium}>Medium Body Text</Text>
      <Text style={fonts.bodySmall}>Small Body Text</Text>
      
      {/* Button Text */}
      <Text style={fonts.buttonLarge}>Large Button</Text>
      <Text style={fonts.buttonMedium}>Medium Button</Text>
      <Text style={fonts.buttonSmall}>Small Button</Text>
      
      {/* Special Amounts */}
      <Text style={fonts.amountLarge}>₹1,234.56</Text>
      <Text style={fonts.amountMedium}>₹567.89</Text>
      <Text style={fonts.amountSmall}>₹123.45</Text>
      
      {/* White Text (for dark backgrounds) */}
      <View style={styles.darkBackground}>
        <Text style={fonts.whiteLarge}>White Large</Text>
        <Text style={fonts.whiteMedium}>White Medium</Text>
        <Text style={fonts.whiteSmall}>White Small</Text>
      </View>
      
      {/* Grey Text */}
      <Text style={fonts.greyLarge}>Grey Large</Text>
      <Text style={fonts.greyMedium}>Grey Medium</Text>
      <Text style={fonts.greySmall}>Grey Small</Text>
      
      {/* Custom Color Example */}
      <Text style={fonts.withColor(fonts.headerMedium, fonts.colors.accent)}>
        Custom Color Header
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  darkBackground: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
  },
});

export default FontExample;
